import { CreateOrderDTO, OrderQuery, UpdateStatusDTO } from "@/app/schemas/orderForm";
import { IOrder } from "@/interfaces/IOrder";
import connectDB from "@/lib/db/db";
import { CustomerModel } from "@/lib/db/models/customer";
import { OrderModel } from "@/lib/db/models/order";
import StockModel from "@/lib/db/models/stock";
import VariantModel from "@/lib/db/models/variant";
import { ClientSession, FilterQuery } from "mongoose";
import mongoose from "mongoose";

// Genera un número de pedido único con formato: ORD-2024-12345
function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `ORD-${year}-${rand}`;
}

// Calcula el subtotal sumando el precio unitario * cantidad * (1 - descuento) para cada ítem
function calcSubtotal(items: CreateOrderDTO["items"]) {
  return items.reduce((acc, item) => {
    const s = item.unitPrice * item.quantity * (1 - item.discount / 100);
    return acc + s;
  }, 0);
}

// Servicio de PEDIDOS con lógica de negocio y transacciones
class OrderService {

  // Crea nuevo pedido y actualiza las stats del cliente dentro de una transacción.
  // También verifica y descuenta el stock de cada ítem.
  async create(data: CreateOrderDTO) {
    await connectDB();

    const session: ClientSession = await mongoose.startSession();
    session.startTransaction();

    try {
      // ── Paso 1: Resolver variante y verificar stock por ítem ──────────────────
      const resolvedItems: { item: CreateOrderDTO["items"][number]; variantId: string | null }[] = [];

      for (const item of data.items) {
        const variantIdStr = item.variantId?.trim() || null;
        let resolvedVariantId: string | null = variantIdStr;

        if (!resolvedVariantId) {
          // Producto sin variante explícita → buscar la variante por defecto
          const defaultVariant = await VariantModel.findOne(
            { productId: item.productId, isDefault: true, isActive: true },
            "_id"
          ).session(session).lean() as { _id: mongoose.Types.ObjectId } | null;
          resolvedVariantId = defaultVariant?._id?.toString() ?? null;
        }

        if (resolvedVariantId) {
          const stock = await StockModel.findOne(
            { variantId: resolvedVariantId, branchId: data.branchId },
            "quantityAvailable"
          ).session(session).lean() as { quantityAvailable: number } | null;

          const available = stock?.quantityAvailable ?? 0;
          if (available < item.quantity) {
            throw new Error(
              `Stock insuficiente para "${item.name}" (disponible: ${available}, solicitado: ${item.quantity})`
            );
          }
        }

        resolvedItems.push({ item, variantId: resolvedVariantId });
      }

      // ── Paso 2: Calcular totales ──────────────────────────────────────────────
      const items = data.items.map((item) => ({
        ...item,
        subtotal: +(item.unitPrice * item.quantity * (1 - item.discount / 100)).toFixed(2),
      }));

      const subtotal = +calcSubtotal(data.items).toFixed(2);
      const discountTotal = +(items.reduce((a, i) => a + i.unitPrice * i.quantity * (i.discount / 100), 0)).toFixed(2);
      const total = +(subtotal + (data.tax ?? 0) + (data.shippingCost ?? 0)).toFixed(2);

      // ── Paso 3: Crear el pedido ───────────────────────────────────────────────
      const [order] = await OrderModel.create(
        [{
          ...data,
          orderNumber: generateOrderNumber(),
          items,
          subtotal,
          discountTotal,
          total,
          statusHistory: [{ status: "pending", changedAt: new Date() }],
        }],
        { session }
      );

      // ── Paso 4: Actualizar stats del cliente ──────────────────────────────────
      await CustomerModel.findByIdAndUpdate(
        data.customerId,
        {
          $inc: { totalOrders: 1, totalSpent: total },
          $set: { lastOrderAt: new Date() },
        },
        { session }
      );

      // ── Paso 5: Descontar stock de cada ítem ──────────────────────────────────
      for (const { item, variantId } of resolvedItems) {
        if (!variantId) continue;
        await StockModel.findOneAndUpdate(
          { variantId, branchId: data.branchId },
          {
            $inc: { quantityOnHand: -item.quantity, quantityAvailable: -item.quantity },
            $set: { lastUpdatedAt: new Date() },
          },
          { session }
        );
      }

      await session.commitTransaction();
      return order;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  // Busca PEDIDOS con filtros, paginación y pedidoamiento
  async findAll(query: OrderQuery) {
    await connectDB();
    const { page, limit, customerId, branchId, status, paymentStatus, from, to, sortBy, sortOrder } = query;

    const filter: FilterQuery<IOrder> = {};
    if (customerId) filter.customerId = customerId;
    if (branchId) filter.branchId = branchId;
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 } as Record<string, 1 | -1>;
    const total = await OrderModel.countDocuments(filter);
    const data = await OrderModel.find(filter)
      .populate("customerId", "firstName lastName email")
      .populate("branchId", "name")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // Busca un pedido por ID y la popula con datos del cliente y sucursal
  async findById(id: string) {
    await connectDB();
    const order = await OrderModel.findById(id)
      .populate("customerId", "firstName lastName email phone")
      .populate("branchId", "name address")
      .lean();
    if (!order) throw new Error("Pedido no encontrado");
    return order;
  }

  // Actualiza el estado de una pedido con validación de transiciones y registro en el historial de estados
  async updateStatus(id: string, dto: UpdateStatusDTO) {
    await connectDB();
    const order = await OrderModel.findById(id);
    if (!order) throw new Error("Pedido no encontrado");

    const validTransitions: Record<string, string[]> = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: ["refunded"],
      cancelled: [],
      refunded: [],
    };

    if (!validTransitions[order.status]?.includes(dto.status)) {
      throw new Error(`Transición inválida: ${order.status} → ${dto.status}`);
    }

    order.status = dto.status;
    order.statusHistory.push({
      status: dto.status,
      changedAt: new Date(),
      changedBy: dto.changedBy ? new mongoose.Types.ObjectId(dto.changedBy) : undefined,
      note: dto.note,
    });

    if (dto.status === "cancelled") {
      order.cancelReason = dto.note;
      // Revertir stats del cliente
      await CustomerModel.findByIdAndUpdate(order.customerId, {
        $inc: { totalOrders: -1, totalSpent: -order.total },
      });
    }

    return order.save();
  }

  // Actualiza el estado de pago y/o método de pago de un pedido
  async updatePayment(id: string, dto: {
    paymentStatus: import("@/interfaces/IOrder").PaymentStatus;
    paymentMethod?: import("@/interfaces/IOrder").PaymentMethod;
    installments?: import("@/interfaces/IOrder").IInstallments;
  }) {
    await connectDB();
    const order = await OrderModel.findById(id);
    if (!order) throw new Error("Pedido no encontrado");

    order.paymentStatus = dto.paymentStatus;
    if (dto.paymentMethod) order.paymentMethod = dto.paymentMethod;

    if (dto.paymentMethod === "credit_card" && dto.installments) {
      order.installments = dto.installments;
    } else if (dto.paymentMethod && dto.paymentMethod !== "credit_card") {
      order.set("installments", undefined);
    }

    return order.save();
  }

  async delete(id: string) {
    await connectDB();
    // Los pedidos nunca se borran, se cancelan
    throw new Error("Los pedidos no pueden eliminarse. Usá cancelación.");
  }
}

export const orderService = new OrderService();
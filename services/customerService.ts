
import { AdjustCreditDTO, CreateCustomerDTO, CustomerQuery, UpdateCustomerDTO } from "@/app/schemas/customerForm";
import { ICustomer } from "@/interfaces/ICustomer";
import connectDB from "@/lib/db/db";
import { CustomerModel } from "@/lib/db/models/customer";
import { ClientSession, FilterQuery } from "mongoose";

class CustomerService {
  // ── CRUD ───────────────────────────────────────────────────────────────

  async create(data: CreateCustomerDTO) {
    await connectDB();
    const existing = await CustomerModel.findOne({ email: data.email });
    if (existing) throw new Error("Ya existe un cliente con ese email");

    // Validar CUIT único (ya lo maneja el índice sparse, pero mejor error amigable)
    if (data.taxId) {
      const cuitConflict = await CustomerModel.findOne({ taxId: data.taxId });
      if (cuitConflict) throw new Error("Ya existe un cliente con ese CUIT");
    }

    return CustomerModel.create(data);
  }

  async findAll(query: CustomerQuery) {
    await connectDB();
    const { page, limit, search, status, branchId, taxType, hasDebt, sortBy, sortOrder } = query;

    const filter: FilterQuery<ICustomer> = {};
    if (status) filter.status = status;
    if (branchId) filter.branchId = branchId;
    if (taxType) filter.taxType = taxType;
    if (hasDebt) filter.creditBalance = { $gt: 0 };

    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { phone: regex },
        { taxId: regex },
      ];
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 } as Record<string, 1 | -1>;
    const total = await CustomerModel.countDocuments(filter);
    const data = await CustomerModel.find(filter).sort(sort).skip(skip).limit(limit).lean();

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    await connectDB();
    const customer = await CustomerModel.findById(id).lean();
    if (!customer) throw new Error("Cliente no encontrado");
    return customer;
  }

  async update(id: string, data: UpdateCustomerDTO) {
    await connectDB();

    if (data.email) {
      const conflict = await CustomerModel.findOne({ email: data.email, _id: { $ne: id } });
      if (conflict) throw new Error("Ya existe un cliente con ese email");
    }

    if (data.taxId) {
      const conflict = await CustomerModel.findOne({ taxId: data.taxId, _id: { $ne: id } });
      if (conflict) throw new Error("Ya existe un cliente con ese CUIT");
    }

    const updated = await CustomerModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) throw new Error("Cliente no encontrado");
    return updated;
  }

  /** Soft delete: pasa a "inactive". Los pedidos quedan intactos. */
  async delete(id: string) {
    await connectDB();
    const updated = await CustomerModel.findByIdAndUpdate(
      id,
      { status: "inactive" },
      { new: true }
    ).lean();
    if (!updated) throw new Error("Cliente no encontrado");
    return updated;
  }

  // ── Stats (llamado por orderService en transaction) ────────────────────

  async updateStats(
    customerId: string,
    orderTotal: number,
    session?: ClientSession
  ) {
    await connectDB();
    return CustomerModel.findByIdAndUpdate(
      customerId,
      {
        $inc: { totalOrders: 1, totalSpent: orderTotal },
        $set: { lastOrderAt: new Date() },
      },
      { session }
    );
  }

  async revertStats(
    customerId: string,
    orderTotal: number,
    session?: ClientSession
  ) {
    await connectDB();
    return CustomerModel.findByIdAndUpdate(
      customerId,
      { $inc: { totalOrders: -1, totalSpent: -orderTotal } },
      { session }
    );
  }

  // ── Cuenta corriente ───────────────────────────────────────────────────

  /**
   * Ajusta el saldo de cuenta corriente.
   *  - type "debit"  → suma al balance (cliente queda debiendo más)
   *  - type "credit" → resta del balance (cliente paga o recibe NC)
   */
  async adjustCredit(id: string, dto: AdjustCreditDTO) {
    await connectDB();

    const customer = await CustomerModel.findById(id);
    if (!customer) throw new Error("Cliente no encontrado");

    const delta =
      dto.type === "debit" ? Math.abs(dto.amount) : -Math.abs(dto.amount);

    const updated = await CustomerModel.findByIdAndUpdate(
      id,
      { $inc: { creditBalance: delta } },
      { new: true }
    ).lean();

    return updated;
  }
}

export const customerService = new CustomerService();

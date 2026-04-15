"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  MapPin,
  Building2,
  CreditCard,
  FileText,
  ChevronRight,
  CheckCircle2,
  Circle,
  Ban,
  RefreshCw,
  Clock,
  Truck,
  Package,
  PackageCheck,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { OrderStatusBadge } from "../OrderStatusBadge";
import { useToast } from "@/hooks/use-toast";
import type { OrderStatus, PaymentStatus, PaymentMethod } from "@/interfaces/IOrder";

// ── Types ──────────────────────────────────────────────────────────────────────

interface OrderItem {
  productId: string;
  variantId?: string;
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  subtotal: number;
}

interface PopulatedOrder {
  _id: string;
  orderNumber: string;
  customerId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  branchId: {
    _id: string;
    branchName?: string;
    name?: string;
    address?: string;
  };
  employeeId?: string;
  items: OrderItem[];
  subtotal: number;
  discountTotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  installments?: { quantity: number; withInterest: boolean };
  notes?: string;
  shippingType?: "delivery" | "pickup";
  shippingAddress?: {
    street: string;
    city: string;
    province: string;
    postalCode?: string;
    country: string;
  };
  cancelReason?: string;
  statusHistory: Array<{
    status: OrderStatus;
    changedAt: string;
    note?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; className: string; dotClass: string }
> = {
  pending:  { label: "Pago pendiente", className: "bg-amber-500/15 text-amber-500 border border-amber-500/30",  dotClass: "bg-amber-500" },
  partial:  { label: "Pago parcial",   className: "bg-blue-500/15 text-blue-400 border border-blue-500/30",    dotClass: "bg-blue-400" },
  paid:     { label: "Pagado",         className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30", dotClass: "bg-emerald-400" },
  refunded: { label: "Reembolsado",    className: "bg-gray-500/15 text-gray-400 border border-gray-500/30",    dotClass: "bg-gray-400" },
  failed:   { label: "Pago fallido",   className: "bg-red-500/15 text-red-400 border border-red-500/30",       dotClass: "bg-red-400" },
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash:         "Efectivo",
  transfer:     "Transferencia bancaria",
  debit_card:   "Tarjeta de débito",
  credit_card:  "Tarjeta de crédito",
  mercadopago:  "Mercado Pago",
  modo:         "Modo",
  uala:         "Ualá",
  naranja_x:    "Naranja X",
  personal_pay: "Personal Pay",
  cuenta_dni:   "Cuenta DNI",
  qr:           "Pago con QR",
  cheque:       "Cheque",
  other:        "Otro",
};

// Main flow steps — cancelled/refunded are handled separately
const FLOW_STEPS: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

const FLOW_STEP_LABELS: Record<OrderStatus, string> = {
  pending:    "Pendiente",
  confirmed:  "Confirmado",
  processing: "En proceso",
  shipped:    "Despachado",
  delivered:  "Entregado",
  cancelled:  "Cancelado",
  refunded:   "Reembolsado",
};

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:    ["confirmed", "cancelled"],
  confirmed:  ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped:    ["delivered"],
  delivered:  ["refunded"],
  cancelled:  [],
  refunded:   [],
};

const STATUS_HISTORY_LABELS: Record<OrderStatus, string> = FLOW_STEP_LABELS;

// ── Sub-components ─────────────────────────────────────────────────────────────

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const cfg = PAYMENT_STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
      {cfg.label}
    </span>
  );
}

function StatusStepper({ status }: { status: OrderStatus }) {
  const isCancelled = status === "cancelled";
  const isRefunded = status === "refunded";
  const currentIdx = FLOW_STEPS.indexOf(status);

  if (isCancelled || isRefunded) {
    return (
      <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md w-fit ${isCancelled ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-gray-500/10 text-gray-400 border border-gray-500/20"}`}>
        <Ban size={14} />
        <span className="font-medium">{isCancelled ? "Pedido cancelado" : "Pedido reembolsado"}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0">
      {FLOW_STEPS.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        const isLast = idx === FLOW_STEPS.length - 1;

        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors
                ${done ? "bg-primary text-primary-foreground" : active ? "bg-primary/20 text-primary border-2 border-primary" : "bg-muted text-muted-foreground"}`}>
                {done ? <CheckCircle2 size={14} /> : idx + 1}
              </div>
              <span className={`text-[10px] whitespace-nowrap font-medium ${active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"}`}>
                {FLOW_STEP_LABELS[step]}
              </span>
            </div>
            {!isLast && (
              <div className={`h-[2px] w-10 sm:w-16 mb-3 mx-1 ${done ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function OrderDetailView({ order: initialOrder }: { order: PopulatedOrder }) {
  const router = useRouter();
  const { toast } = useToast();
  const [order, setOrder] = useState<PopulatedOrder>(initialOrder);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

  // Cancel dialog state
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Payment dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [pendingPaymentStatus, setPendingPaymentStatus] = useState<PaymentStatus>("paid");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(
    order.paymentMethod ?? "cash"
  );
  const [installmentQty, setInstallmentQty] = useState<number | "">(
    order.installments?.quantity ?? ""
  );
  const [installmentInterest, setInstallmentInterest] = useState<boolean>(
    order.installments?.withInterest ?? false
  );

  // Status advance confirm
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);
  const [pendingNextStatus, setPendingNextStatus] = useState<OrderStatus | null>(null);

  const nextStatuses = VALID_TRANSITIONS[order.status].filter((s) => s !== "cancelled");
  const canCancel = VALID_TRANSITIONS[order.status].includes("cancelled");
  const isTerminal = order.status === "cancelled" || order.status === "refunded";

  // ── Status update ────────────────────────────────────────────────────────────

  async function advanceStatus(newStatus: OrderStatus, note?: string) {
    setLoadingStatus(true);
    try {
      const res = await fetch(`/api/orders/${order._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, note }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message ?? "Error al actualizar estado");
      // Merge updated fields, keep populated refs from current state
      setOrder((prev) => ({
        ...prev,
        status: newStatus,
        cancelReason: note && newStatus === "cancelled" ? note : prev.cancelReason,
        statusHistory: [
          ...prev.statusHistory,
          { status: newStatus, changedAt: new Date().toISOString(), note },
        ],
      }));
      toast({ title: "Estado actualizado", description: `Pedido marcado como ${FLOW_STEP_LABELS[newStatus]}` });
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoadingStatus(false);
      setCancelOpen(false);
      setConfirmStatusOpen(false);
      setCancelReason("");
      setPendingNextStatus(null);
    }
  }

  // ── Payment update ───────────────────────────────────────────────────────────

  async function updatePayment() {
    setLoadingPayment(true);
    try {
      const res = await fetch(`/api/orders/${order._id}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentStatus: pendingPaymentStatus,
          paymentMethod: selectedPaymentMethod,
          installments:
            selectedPaymentMethod === "credit_card" && installmentQty !== ""
              ? { quantity: installmentQty, withInterest: installmentInterest }
              : undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message ?? "Error al registrar pago");
      setOrder((prev) => ({
        ...prev,
        paymentStatus: pendingPaymentStatus,
        paymentMethod: selectedPaymentMethod,
        installments:
          selectedPaymentMethod === "credit_card" && installmentQty !== ""
            ? { quantity: installmentQty as number, withInterest: installmentInterest }
            : undefined,
      }));
      toast({ title: "Pago registrado", description: PAYMENT_STATUS_CONFIG[pendingPaymentStatus].label });
      setPaymentDialogOpen(false);
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoadingPayment(false);
    }
  }

  function openPaymentDialog(target: PaymentStatus) {
    setPendingPaymentStatus(target);
    setSelectedPaymentMethod(order.paymentMethod ?? "cash");
    setInstallmentQty(order.installments?.quantity ?? "");
    setInstallmentInterest(order.installments?.withInterest ?? false);
    setPaymentDialogOpen(true);
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const customer = order.customerId;
  const branch = order.branchId;
  const branchName = branch?.branchName ?? branch?.name ?? "—";

  return (
    <div className="space-y-6 pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" className="h-8 w-8 shrink-0 mt-0.5" asChild>
            <Link href="/admin/dashboard/orders"><ArrowLeft size={14} /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-semibold font-mono">{order.orderNumber}</h2>
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Creado el{" "}
              {new Date(order.createdAt).toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* ── Status Stepper ── */}
      <div className="overflow-x-auto">
        <StatusStepper status={order.status} />
      </div>

      {/* ── Action buttons ── */}
      {!isTerminal && (
        <div className="flex flex-wrap items-center gap-2">
          {nextStatuses.map((s) => (
            <Button
              key={s}
              size="sm"
              disabled={loadingStatus}
              onClick={() => {
                if (s === "confirmed" && order.paymentStatus !== "paid") {
                  toast({ description: "El pago del pedido debe estar cobrado para confirmar." });
                  return;
                }
                setPendingNextStatus(s);
                setConfirmStatusOpen(true);
              }}
            >
              Marcar como {FLOW_STEP_LABELS[s]}
            </Button>
          ))}
          {canCancel && (
            <Button
              size="sm"
              variant="destructive"
              disabled={loadingStatus}
              onClick={() => setCancelOpen(true)}
            >
              <Ban size={13} className="mr-1" />
              Cancelar pedido
            </Button>
          )}
        </div>
      )}

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── LEFT: Items + Totals + History ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Items */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package size={15} className="text-muted-foreground" />
                Productos
                <span className="text-xs font-normal text-muted-foreground">({order.items.length} ítem{order.items.length !== 1 ? "s" : ""})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Producto</TableHead>
                    <TableHead className="text-right">Precio unit.</TableHead>
                    <TableHead className="text-right">Cant.</TableHead>
                    <TableHead className="text-right">Desc.</TableHead>
                    <TableHead className="text-right pr-6">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/30">
                      <TableCell className="pl-6">
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{item.sku}</div>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        ${item.unitPrice.toLocaleString("es-AR")}
                      </TableCell>
                      <TableCell className="text-right text-sm">{item.quantity}</TableCell>
                      <TableCell className="text-right text-sm">
                        {item.discount > 0 ? (
                          <span className="text-emerald-500">{item.discount}%</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-6 font-semibold text-sm">
                        ${item.subtotal.toLocaleString("es-AR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Totals summary */}
              <div className="border-t px-6 py-4 space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${order.subtotal.toLocaleString("es-AR")}</span>
                </div>
                {order.discountTotal > 0 && (
                  <div className="flex justify-between text-sm text-emerald-500">
                    <span>Descuento total</span>
                    <span>-${order.discountTotal.toLocaleString("es-AR")}</span>
                  </div>
                )}
                {order.tax > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Impuestos</span>
                    <span>${order.tax.toLocaleString("es-AR")}</span>
                  </div>
                )}
                {order.shippingCost > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Envío</span>
                    <span>${order.shippingCost.toLocaleString("es-AR")}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${order.total.toLocaleString("es-AR")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock size={15} className="text-muted-foreground" />
                Historial de estados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-0">
                {[...order.statusHistory].reverse().map((entry, idx, arr) => {
                  const isFirst = idx === 0;
                  const isLast = idx === arr.length - 1;
                  const isCurrent = isFirst;
                  return (
                    <div key={idx} className="flex gap-3">
                      {/* Timeline line */}
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${isCurrent ? "bg-primary ring-2 ring-primary/30" : "bg-muted-foreground/40"}`} />
                        {!isLast && <div className="w-[1px] bg-border flex-1 min-h-[28px]" />}
                      </div>
                      {/* Content */}
                      <div className="pb-4 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-medium ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                            {STATUS_HISTORY_LABELS[entry.status]}
                          </span>
                          {isCurrent && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">Actual</span>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(entry.changedAt).toLocaleString("es-AR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {entry.note && (
                          <p className="text-xs text-muted-foreground mt-1 italic bg-muted/50 rounded px-2 py-1">
                            "{entry.note}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT: Customer + Payment + Shipping + Notes ── */}
        <div className="space-y-4">

          {/* Customer */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User size={15} className="text-muted-foreground" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div>
                <p className="font-semibold text-sm">
                  {customer.firstName} {customer.lastName}
                </p>
                <p className="text-xs text-muted-foreground break-all">{customer.email}</p>
                {customer.phone && (
                  <p className="text-xs text-muted-foreground">{customer.phone}</p>
                )}
              </div>
              <Separator />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building2 size={12} />
                <span>{branchName}</span>
              </div>
              <Link
                href={`/admin/dashboard/customers/${customer._id}`}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Ver perfil del cliente <ChevronRight size={10} />
              </Link>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard size={15} className="text-muted-foreground" />
                Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {/* Current payment status — prominent */}
              <div className={`rounded-lg p-3 ${PAYMENT_STATUS_CONFIG[order.paymentStatus].className.replace("border", "").replace("border-", "")} bg-opacity-10`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Estado del pago</p>
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">Total</p>
                    <p className="font-bold text-base">${order.total.toLocaleString("es-AR")}</p>
                  </div>
                </div>
              </div>

              {order.paymentMethod && (
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <CreditCard size={11} />
                  <span>Método: <span className="text-foreground font-medium">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</span></span>
                </div>
              )}
              {order.paymentMethod === "credit_card" && order.installments && (
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <CreditCard size={11} />
                  <span>
                    {order.installments.quantity} cuota{order.installments.quantity !== 1 ? "s" : ""}{" "}
                    <span className="text-foreground font-medium">
                      {order.installments.withInterest ? "con interés" : "sin interés"}
                    </span>
                  </span>
                </div>
              )}

              {/* Payment actions */}
              {!isTerminal && (
                <div className="space-y-2">
                  {order.paymentStatus === "pending" && (
                    <>
                      <Button
                        size="sm"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => openPaymentDialog("paid")}
                      >
                        <CheckCircle2 size={13} className="mr-1.5" />
                        Registrar pago completo
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => openPaymentDialog("partial")}
                      >
                        Registrar pago parcial
                      </Button>
                    </>
                  )}
                  {order.paymentStatus === "partial" && (
                    <Button
                      size="sm"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => openPaymentDialog("paid")}
                    >
                      <CheckCircle2 size={13} className="mr-1.5" />
                      Completar pago
                    </Button>
                  )}
                  {order.paymentStatus === "failed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => openPaymentDialog("paid")}
                    >
                      <RefreshCw size={13} className="mr-1.5" />
                      Registrar nuevo pago
                    </Button>
                  )}
                  {order.paymentStatus === "paid" && order.status === "delivered" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-red-500 border-red-500/30 hover:bg-red-500/10"
                      onClick={() => openPaymentDialog("refunded")}
                    >
                      Registrar reembolso
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping / Pickup */}
          {order.shippingType && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {order.shippingType === "delivery" ? (
                    <Truck size={15} className="text-muted-foreground" />
                  ) : (
                    <PackageCheck size={15} className="text-muted-foreground" />
                  )}
                  {order.shippingType === "delivery" ? "Envío a domicilio" : "Retiro en sucursal"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-1.5 text-sm">
                {order.shippingType === "delivery" && order.shippingAddress && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin size={12} className="mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p>{order.shippingAddress.street}</p>
                      <p>{order.shippingAddress.city}, {order.shippingAddress.province}</p>
                      {order.shippingAddress.postalCode && <p>CP {order.shippingAddress.postalCode}</p>}
                      <p>{order.shippingAddress.country}</p>
                    </div>
                  </div>
                )}
                {order.shippingType === "pickup" && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Building2 size={12} />
                    <span>{branchName}</span>
                  </div>
                )}
                {order.shippingCost > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Costo de envío: <span className="text-foreground">${order.shippingCost.toLocaleString("es-AR")}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Cancel reason */}
          {order.cancelReason && (
            <Card className="border-red-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-red-400">
                  <AlertTriangle size={15} />
                  Motivo de cancelación
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground italic">"{order.cancelReason}"</p>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText size={15} className="text-muted-foreground" />
                  Notas
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── Confirm status advance dialog ── */}
      <AlertDialog open={confirmStatusOpen} onOpenChange={setConfirmStatusOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cambio de estado</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingNextStatus && (
                <>
                  ¿Estás seguro de que querés marcar este pedido como{" "}
                  <strong>{FLOW_STEP_LABELS[pendingNextStatus]}</strong>?
                  Esta acción quedará registrada en el historial.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loadingStatus}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={loadingStatus}
              onClick={() => pendingNextStatus && advanceStatus(pendingNextStatus)}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Cancel order dialog ── */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <Ban size={16} />
              Cancelar pedido
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Esta acción no puede revertirse. El pedido quedará en estado <strong>Cancelado</strong> y las estadísticas del cliente serán ajustadas.
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Motivo de cancelación</label>
              <Textarea
                placeholder="Ej: Cliente solicitó cancelación, producto sin stock, etc."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={loadingStatus}>
              Volver
            </Button>
            <Button
              variant="destructive"
              disabled={loadingStatus || !cancelReason.trim()}
              onClick={() => advanceStatus("cancelled", cancelReason.trim())}
            >
              {loadingStatus ? "Cancelando..." : "Confirmar cancelación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Register payment dialog ── */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard size={16} />
              Registrar pago
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-muted/50 p-3 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Importe del pedido</span>
              <span className="font-bold text-lg">${order.total.toLocaleString("es-AR")}</span>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Estado de pago a registrar</label>
              <div className="flex gap-2">
                {(["paid", "partial"] as PaymentStatus[]).map((ps) => (
                  <button
                    key={ps}
                    onClick={() => setPendingPaymentStatus(ps)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors
                      ${pendingPaymentStatus === ps
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"}`}
                  >
                    {ps === "paid" ? "Pago completo" : "Pago parcial"}
                  </button>
                ))}
                {pendingPaymentStatus === "refunded" && (
                  <div className="flex-1 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 px-3 py-2 text-xs font-medium text-center">
                    Reembolso
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Método de pago</label>
              <Select
                value={selectedPaymentMethod}
                onValueChange={(v) => {
                  setSelectedPaymentMethod(v as PaymentMethod);
                  if (v !== "credit_card") {
                    setInstallmentQty("");
                    setInstallmentInterest(false);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPaymentMethod === "credit_card" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Cuotas</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    placeholder="Ej. 12"
                    value={installmentQty}
                    onChange={(e) =>
                      setInstallmentQty(e.target.value === "" ? "" : parseInt(e.target.value))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
                    }}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Interés</label>
                  <Select
                    value={String(installmentInterest)}
                    onValueChange={(v) => setInstallmentInterest(v === "true")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">Sin interés</SelectItem>
                      <SelectItem value="true">Con interés</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            {pendingPaymentStatus === "partial" && (
              <div className="text-xs text-amber-500 bg-amber-500/10 rounded px-2 py-1.5 border border-amber-500/20">
                El pago parcial indica que el cliente abonó solo una parte del total. Podés actualizar a "Pagado completo" cuando se reciba el saldo restante.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)} disabled={loadingPayment}>
              Cancelar
            </Button>
            <Button
              disabled={loadingPayment}
              onClick={updatePayment}
              className={pendingPaymentStatus === "refunded" ? "bg-red-600 hover:bg-red-700 text-white" : ""}
            >
              {loadingPayment ? "Guardando..." : "Confirmar pago"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

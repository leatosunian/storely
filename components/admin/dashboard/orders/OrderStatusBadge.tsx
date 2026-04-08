import type { OrderStatus } from "@/interfaces/IOrder";

const config: Record<OrderStatus, { label: string; className: string }> = {
  pending:    { label: "Pendiente",    className: "bg-amber-500/20 text-amber-500" },
  confirmed:  { label: "Confirmado",   className: "bg-blue-500/20 text-blue-400" },
  processing: { label: "En proceso",   className: "bg-sky-500/20 text-sky-400" },
  shipped:    { label: "Despachado",   className: "bg-violet-500/20 text-violet-400" },
  delivered:  { label: "Entregado",    className: "bg-emerald-500/20 text-emerald-400" },
  cancelled:  { label: "Cancelado",    className: "bg-red-500/20 text-red-400" },
  refunded:   { label: "Reembolsado",  className: "bg-gray-500/20 text-gray-400" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, className } = config[status] ?? config.pending;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

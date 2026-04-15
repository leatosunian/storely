"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  TAX_TYPE_LABELS, TAX_TYPE_INVOICE, type ICustomer,
} from "@/interfaces/ICustomer";
import {
  User, Mail, Phone, MapPin, FileText, Tag, CreditCard,
  ShoppingBag, TrendingUp, Calendar, Pencil, AlertTriangle,
} from "lucide-react";
import { CustomerFormDialog } from "@/components/admin/dashboard/customers/CustomerFormDialog";

// interfaces 

interface CustomerWithId extends Omit<ICustomer, '_id' | 'createdAt' | 'updatedAt'> {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderRow {
  _id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

// helpers

const ARS = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

const formatCuit = (raw?: string) => {
  if (!raw || raw.length !== 11) return raw ?? "—";
  return `${raw.slice(0, 2)}-${raw.slice(2, 10)}-${raw.slice(10)}`;
};

const orderStatusLabel: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-yellow-500/20 text-yellow-400" },
  confirmed: { label: "Confirmado", color: "bg-blue-500/20 text-blue-400" },
  processing: { label: "En proceso", color: "bg-indigo-500/20 text-indigo-400" },
  shipped: { label: "Enviado", color: "bg-purple-500/20 text-purple-400" },
  delivered: { label: "Entregado", color: "bg-emerald-500/20 text-emerald-400" },
  cancelled: { label: "Cancelado", color: "bg-red-500/20 text-red-400" },
  refunded: { label: "Reembolsado", color: "bg-gray-500/20 text-gray-400" },
};

const customerStatusConfig = {
  active: { label: "Activo", className: "bg-emerald-500/20 text-emerald-400" },
  inactive: { label: "Inactivo", className: "bg-gray-500/20 text-gray-400" },
  blocked: { label: "Bloqueado", className: "bg-red-500/20 text-red-400" },
};

// Stats Card 

function StatCard({
  icon: Icon, label, value, sub, highlight,
}: {
  icon: React.ElementType; label: string; value: string;
  sub?: string; highlight?: "green" | "red";
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={`text-xl font-semibold ${highlight === "green" ? "text-emerald-400"
                : highlight === "red" ? "text-red-400"
                  : ""
              }`}>
              {value}
            </p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className="p-2 rounded-md bg-muted">
            <Icon size={16} className="text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main component 

export function CustomerProfileClient({ customer: initial }: { customer: CustomerWithId }) {
  const { toast } = useToast();
  const [customer, setCustomer] = useState<CustomerWithId>(initial);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const s = customerStatusConfig[customer.status] ?? customerStatusConfig.inactive;

  // Pedidos 

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    const res = await fetch(`/api/customers/${customer._id}/orders`);
    const json = await res.json();
    if (json.success) setOrders(json.data);
    setOrdersLoading(false);
  }, [customer._id]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Después de editar 
  const handleUpdated = async () => {
    setEditOpen(false);
    const res = await fetch(`/api/customers/${customer._id}`);
    const json = await res.json();
    if (json.success) setCustomer(json.data);
    toast({ title: "Cliente actualizado" });
  };

  // Render 
  return (
    <>
      {/* Header  */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted text-lg font-semibold">
            {customer.firstName[0]}{customer.lastName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold">
                {customer.firstName} {customer.lastName}
              </h2>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.className}`}>
                {s.label}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1">
                <Mail size={12} />{customer.email}
              </span>
              {customer.taxId && (
                <span className="flex items-center gap-1 font-mono">
                  <FileText size={12} />{formatCuit(customer.taxId)}
                </span>
              )}
            </div>
          </div>
        </div>

        <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditOpen(true)}>
          <Pencil size={14} />
          Editar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={ShoppingBag}
          label="Pedidos totales"
          value={String(customer.totalOrders)}
        />
        <StatCard
          icon={TrendingUp}
          label="Total gastado"
          value={ARS.format(customer.totalSpent)}
        />
        <StatCard
          icon={Calendar}
          label="Último pedido"
          value={customer.lastOrderAt
            ? new Date(customer.lastOrderAt).toLocaleDateString("es-AR")
            : "—"}
        />
        <StatCard
          icon={CreditCard}
          label="Saldo cuenta cte."
          value={ARS.format(customer.creditBalance ?? 0)}
          sub={customer.creditLimit > 0
            ? `Límite: ${ARS.format(customer.creditLimit)}`
            : "Sin crédito habilitado"}
          highlight={
            (customer.creditBalance ?? 0) > 0 ? "red"
              : (customer.creditBalance ?? 0) < 0 ? "green"
                : undefined
          }
        />
      </div>

      {/* Tabs  */}
      <Tabs defaultValue="datos">
        <TabsList className="mb-4">
          <TabsTrigger value="datos">Datos</TabsTrigger>
          <TabsTrigger value="pedidos">Pedidos ({customer.totalOrders})</TabsTrigger>
          <TabsTrigger value="fiscal">Datos fiscales</TabsTrigger>
          <TabsTrigger value="notas">Notas y etiquetas</TabsTrigger>
        </TabsList>

        {/* Tab: Datos generales */}
        <TabsContent value="datos">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Información de contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row icon={User} label="Nombre completo"
                value={`${customer.firstName} ${customer.lastName}`} />
              <Row icon={Mail} label="Email" value={customer.email} />
              <Row icon={Phone} label="Teléfono" value={customer.phone ?? "—"} />

              {customer.address ? (
                <>
                  <Separator />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-1">
                    Dirección
                  </p>
                  <Row
                    icon={MapPin}
                    label="Calle"
                    value={`${customer.address.street}, ${customer.address.city}, ${customer.address.province}${customer.address.postalCode ? ` (${customer.address.postalCode})` : ""
                      }`}
                  />
                </>
              ) : (
                <p className="text-muted-foreground italic">Sin dirección registrada.</p>
              )}

              <Separator />
              <Row
                icon={Calendar}
                label="Cliente desde"
                value={new Date(customer.createdAt).toLocaleDateString("es-AR", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Pedidos  */}
        <TabsContent value="pedidos">
          <Card>
            <CardContent className="p-0">
              {ordersLoading ? (
                <p className="py-8 text-center text-muted-foreground text-sm">Cargando pedidos...</p>
              ) : orders.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground text-sm">
                  Este cliente aún no tiene pedidos.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Pedido</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Pago</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((o) => {
                      const st = orderStatusLabel[o.status] ?? orderStatusLabel.pending;
                      return (
                        <TableRow key={o._id}>
                          <TableCell className="font-mono text-sm">{o.orderNumber}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(o.createdAt).toLocaleDateString("es-AR")}
                          </TableCell>
                          <TableCell className="font-medium text-sm">{ARS.format(o.total)}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${st.color}`}>
                              {st.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground capitalize">
                            {o.paymentStatus}
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/admin/dashboard/orders/${o._id}`}
                              className="text-primary hover:underline text-xs"
                            >
                              Ver
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Datos fiscales  */}
        <TabsContent value="fiscal">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Información fiscal AFIP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row
                icon={FileText}
                label="CUIT / CUIL"
                value={formatCuit(customer.taxId)}
                mono
              />
              <Row
                icon={FileText}
                label="Condición frente al IVA"
                value={customer.taxType ? TAX_TYPE_LABELS[customer.taxType] : "—"}
              />
              {customer.taxType && (
                <Row
                  icon={FileText}
                  label="Tipo de comprobante"
                  value={TAX_TYPE_INVOICE[customer.taxType]}
                />
              )}

              {customer.taxType === "responsable_inscripto" && !customer.taxId && (
                <div className="flex items-center gap-2 p-3 bg-yellow-500/10 rounded-md text-yellow-400 text-xs mt-2">
                  <AlertTriangle size={14} />
                  <span>
                    El cliente es Responsable Inscripto pero no tiene CUIT registrado.
                    Se necesita para emitir Factura A.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Notas y etiquetas */}
        <TabsContent value="notas">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Etiquetas</CardTitle>
            </CardHeader>
            <CardContent>
              {customer.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {customer.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      <Tag size={11} />{tag}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm italic">Sin etiquetas.</p>
              )}
            </CardContent>
          </Card>

          <Card className="mt-3">
            <CardHeader>
              <CardTitle className="text-sm">Notas internas</CardTitle>
            </CardHeader>
            <CardContent>
              {customer.notes ? (
                <p className="text-sm whitespace-pre-line">{customer.notes}</p>
              ) : (
                <p className="text-muted-foreground text-sm italic">Sin notas.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit dialog */}
      <CustomerFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={handleUpdated}
        customer={customer as any}
      />
    </>
  );
}

// Sub-component 
function Row({
  icon: Icon, label, value, mono = false,
}: {
  icon: React.ElementType; label: string; value: string; mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={14} className="text-muted-foreground mt-0.5 shrink-0" />
      <span className="text-muted-foreground w-44 shrink-0">{label}</span>
      <span className={`flex-1 ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

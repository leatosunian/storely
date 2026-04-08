"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { OrderStatusBadge } from "./OrderStatusBadge";
import type { OrderStatus } from "@/interfaces/IOrder";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface OrderRow {
  _id: string;
  orderNumber: string;
  customerId: { firstName: string; lastName: string; email: string };
  total: number;
  status: OrderStatus;
  paymentStatus: string;
  createdAt: string;
}

interface PaginatedOrders {
  data: OrderRow[];
  total: number;
  pages: number;
  page: number;
}

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

export function OrderTable() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [meta, setMeta] = useState<Omit<PaginatedOrders, "data">>({ total: 0, pages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [search, setSearch] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set("status", status);
    const res = await fetch(`/api/orders?${params}`);
    const json = await res.json();
    if (json.success) {
      setOrders(json.data);
      setMeta({ total: json.total, pages: json.pages, page: json.page });
    }
    setLoading(false);
  }, [page, status, limit]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filteredOrders = orders.filter((order) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(q) ||
      order.customerId.firstName.toLowerCase().includes(q) ||
      order.customerId.lastName.toLowerCase().includes(q) ||
      order.customerId.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex items-center justify-between w-full gap-3 pt-1 pb-3">
        <Input
          placeholder="🔎︎  Buscar orden o cliente..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-4">
          <Select
            value={status}
            onValueChange={(value) => { setStatus(value === "all" ? "" : value as OrderStatus); setPage(1); }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Estado</SelectLabel>
                <SelectItem value="all">Todos los estados</SelectItem>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">{meta.total} órdenes</span>
        </div>
      </div>

      {/* Tabla */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N°</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No hay resultados.
                </TableCell>
              </TableRow>
            ) : filteredOrders.map((order) => (
              <TableRow key={order._id}>
                <TableCell className="font-mono text-xs">{order.orderNumber}</TableCell>
                <TableCell>
                  <div className="font-medium text-sm">{order.customerId.firstName} {order.customerId.lastName}</div>
                  <div className="text-xs text-muted-foreground">{order.customerId.email}</div>
                </TableCell>
                <TableCell className="font-medium text-sm">${order.total.toLocaleString("es-AR")}</TableCell>
                <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                <TableCell>
                  <span className={`text-xs ${order.paymentStatus === "paid" ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}`}>
                    {order.paymentStatus}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString("es-AR")}
                </TableCell>
                <TableCell>
                  <Link href={`/admin/dashboard/orders/${order._id}`} className="text-blue-600 dark:text-blue-400 hover:underline text-xs">
                    Ver
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* desktop footer */}
      <div className="flex-col items-center justify-end hidden w-full gap-8 py-4 mx-auto md:flex md:flex-row sm:justify-start">
        <div className="flex items-center gap-4 w-fit">
          <Button
            variant="outline"
            size="icon"
            className="p-1 text-sm font-light h-9 w-9"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <IoIosArrowBack size={14} />
          </Button>
          <div>
            <span className="text-sm font-semibold unselectable">Página {page} de {meta.pages}</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="p-1 text-sm font-light h-9 w-9"
            onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
            disabled={page === meta.pages}
          >
            <IoIosArrowForward size={14} />
          </Button>
        </div>

        <div className="text-sm w-fit text-muted-foreground unselectable">
          {meta.total} órdenes en total.
        </div>

        <div className="flex flex-row items-center gap-2 text-sm">
          <span className="text-sm unselectable">Mostrar</span>
          <Select
            value={limit.toString()}
            onValueChange={(value) => { setLimit(Number(value)); setPage(1); }}
          >
            <SelectTrigger className="w-16 py-1 pl-3 pr-2 text-sm h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Cantidad</SelectLabel>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="40">40</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* desktop footer */}

      {/* mobile footer */}
      <div className="flex flex-col items-center justify-end w-full gap-2 py-4 mx-auto md:hidden md:flex-row sm:justify-between">
        <div className="flex-1 text-sm text-muted-foreground unselectable">
          {meta.total} órdenes en total.
        </div>

        <div className="flex items-center justify-between w-full my-2 h-fit">
          <div className="flex flex-row items-center justify-center gap-2 mt-0 text-sm w-fit">
            <span className="text-sm unselectable">Mostrar</span>
            <Select
              value={limit.toString()}
              onValueChange={(value) => { setLimit(Number(value)); setPage(1); }}
            >
              <SelectTrigger className="w-16 py-1 pl-3 pr-2 text-sm h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Cantidad</SelectLabel>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="40">40</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="p-1 text-sm font-light h-9 w-9"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <IoIosArrowBack size={14} />
            </Button>
            <span className="text-sm font-semibold unselectable">Página {page} de {meta.pages}</span>
            <Button
              variant="outline"
              size="icon"
              className="p-1 text-sm font-light h-9 w-9"
              onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
              disabled={page === meta.pages}
            >
              <IoIosArrowForward size={14} />
            </Button>
          </div>
        </div>
      </div>
      {/* mobile footer */}
    </div>
  );
}

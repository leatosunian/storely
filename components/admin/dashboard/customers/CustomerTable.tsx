"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Badge }    from "@/components/ui/badge";
import {
  Select, SelectContent, SelectGroup, SelectItem,
  SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { TAX_TYPE_LABELS, type TaxType, type CustomerStatus } from "@/interfaces/ICustomer";

// ── Types ──────────────────────────────────────────────────────────────────

interface CustomerRow {
  _id:           string;
  firstName:     string;
  lastName:      string;
  email:         string;
  phone?:        string;
  taxId?:        string;
  taxType?:      TaxType;
  status:        CustomerStatus;
  tags:          string[];
  totalOrders:   number;
  totalSpent:    number;
  creditBalance: number;
  lastOrderAt?:  string;
}

interface PaginatedCustomers {
  data:  CustomerRow[];
  total: number;
  pages: number;
  page:  number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const ARS = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

const formatCuit = (raw?: string) => {
  if (!raw || raw.length !== 11) return raw ?? "—";
  return `${raw.slice(0, 2)}-${raw.slice(2, 10)}-${raw.slice(10)}`;
};

const statusConfig: Record<CustomerStatus, { label: string; className: string }> = {
  active:   { label: "Activo",    className: "bg-emerald-500/20 text-emerald-400" },
  inactive: { label: "Inactivo",  className: "bg-gray-500/20 text-gray-400" },
  blocked:  { label: "Bloqueado", className: "bg-red-500/20 text-red-400" },
};

// ── Component ──────────────────────────────────────────────────────────────

interface Props {
  /** Incrementar para forzar re-fetch (ej: después de crear un cliente) */
  refreshKey?: number;
}

export function CustomerTable({ refreshKey = 0 }: Props) {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [meta,      setMeta]      = useState<Omit<PaginatedCustomers, "data">>({
    total: 0, pages: 1, page: 1,
  });
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [limit,    setLimit]    = useState(10);
  const [search,   setSearch]   = useState("");
  const [status,   setStatus]   = useState<CustomerStatus | "">("");

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    const res  = await fetch(`/api/customers?${params}`);
    const json = await res.json();
    if (json.success) {
      setCustomers(json.data);
      setMeta({ total: json.total, pages: json.pages, page: json.page });
    }
    setLoading(false);
  }, [page, search, status, limit, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleSearch = (val: string) => { setSearch(val); setPage(1); };
  const handleStatus = (val: string) => {
    setStatus(val === "all" ? "" : (val as CustomerStatus));
    setPage(1);
  };

  return (
    <div>
      {/* ── Filtros ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 pt-1 pb-3">
        <Input
          placeholder="🔎︎  Buscar por nombre, email, CUIT..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="max-w-sm"
        />

        <Select value={status || "all"} onValueChange={handleStatus}>
          <SelectTrigger className="w-36 h-9 text-sm">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
            <SelectItem value="blocked">Bloqueados</SelectItem>
          </SelectContent>
        </Select>

        <span className="ml-auto text-sm text-muted-foreground">
          {meta.total} clientes
        </span>
      </div>

      {/* ── Tabla ───────────────────────────────────────────────────── */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">CUIT</TableHead>
              <TableHead className="hidden lg:table-cell">Cond. IVA</TableHead>
              <TableHead>Pedidos</TableHead>
              <TableHead>Total gastado</TableHead>
              <TableHead className="hidden xl:table-cell">Saldo CC</TableHead>
              <TableHead className="hidden lg:table-cell">Últ. pedido</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                  No hay resultados.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((c) => {
                const s = statusConfig[c.status] ?? statusConfig.inactive;
                return (
                  <TableRow key={c._id}>
                    {/* Nombre + tags */}
                    <TableCell>
                      <div className="font-medium">{c.firstName} {c.lastName}</div>
                      {c.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {c.tags.slice(0, 3).map((t) => (
                            <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0">
                              {t}
                            </Badge>
                          ))}
                          {c.tags.length > 3 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              +{c.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                      {c.email}
                    </TableCell>

                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm font-mono">
                      {formatCuit(c.taxId)}
                    </TableCell>

                    <TableCell className="hidden lg:table-cell text-sm">
                      {c.taxType ? TAX_TYPE_LABELS[c.taxType] : "—"}
                    </TableCell>

                    <TableCell className="text-sm">{c.totalOrders}</TableCell>

                    <TableCell className="font-medium text-sm">
                      {ARS.format(c.totalSpent)}
                    </TableCell>

                    {/* Saldo CC: rojo si debe, verde si tiene saldo a favor */}
                    <TableCell className="hidden xl:table-cell text-sm font-medium">
                      <span className={
                        c.creditBalance > 0
                          ? "text-red-400"
                          : c.creditBalance < 0
                          ? "text-emerald-400"
                          : "text-muted-foreground"
                      }>
                        {ARS.format(c.creditBalance)}
                      </span>
                    </TableCell>

                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                      {c.lastOrderAt
                        ? new Date(c.lastOrderAt).toLocaleDateString("es-AR")
                        : "—"}
                    </TableCell>

                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.className}`}>
                        {s.label}
                      </span>
                    </TableCell>

                    <TableCell>
                      <Link
                        href={`/admin/dashboard/customers/${c._id}`}
                        className="text-primary hover:underline text-xs whitespace-nowrap"
                      >
                        Ver ficha
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Paginación desktop ──────────────────────────────────────── */}
      <div className="hidden md:flex items-center justify-end gap-8 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Mostrar</span>
          <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
            <SelectTrigger className="w-16 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Cantidad</SelectLabel>
                {[5, 10, 15, 20, 30, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-8 w-8"
            onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <IoIosArrowBack size={14} />
          </Button>
          <span className="text-sm font-medium">Página {page} de {meta.pages}</span>
          <Button variant="outline" size="icon" className="h-8 w-8"
            onClick={() => setPage((p) => Math.min(meta.pages, p + 1))} disabled={page === meta.pages}>
            <IoIosArrowForward size={14} />
          </Button>
        </div>

        <span className="text-sm text-muted-foreground">{meta.total} clientes en total.</span>
      </div>

      {/* ── Paginación mobile ───────────────────────────────────────── */}
      <div className="flex md:hidden flex-col items-center gap-2 py-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-8 w-8"
            onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <IoIosArrowBack size={14} />
          </Button>
          <span className="text-sm">{page} / {meta.pages}</span>
          <Button variant="outline" size="icon" className="h-8 w-8"
            onClick={() => setPage((p) => Math.min(meta.pages, p + 1))} disabled={page === meta.pages}>
            <IoIosArrowForward size={14} />
          </Button>
        </div>
        <span className="text-xs text-muted-foreground">{meta.total} clientes en total.</span>
      </div>
    </div>
  );
}

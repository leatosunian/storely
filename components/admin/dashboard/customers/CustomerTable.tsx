"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface CustomerRow {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt?: string;
}

interface PaginatedCustomers {
  data: CustomerRow[];
  total: number;
  pages: number;
  page: number;
}

export function CustomerTable() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [meta, setMeta] = useState<Omit<PaginatedCustomers, "data">>({ total: 0, pages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);
    const res = await fetch(`/api/customers?${params}`);
    const json = await res.json();
    if (json.success) {
      setCustomers(json.data);
      setMeta({ total: json.total, pages: json.pages, page: json.page });
    }
    setLoading(false);
  }, [page, search, limit]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  return (
    <div>
      <div className="flex items-center justify-between w-full gap-3 pt-1 pb-3">
        <Input
          placeholder="🔎︎  Buscar cliente..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">{meta.total} clientes</span>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="hidden md:table-cell">Teléfono</TableHead>
              <TableHead>Órdenes</TableHead>
              <TableHead>Total gastado</TableHead>
              <TableHead className="hidden lg:table-cell">Último pedido</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No hay resultados.
                </TableCell>
              </TableRow>
            ) : customers.map((c) => (
              <TableRow key={c._id}>
                <TableCell className="font-medium">{c.firstName} {c.lastName}</TableCell>
                <TableCell className="text-muted-foreground">{c.email}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{c.phone ?? <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell>{c.totalOrders}</TableCell>
                <TableCell className="font-medium">
                  {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(c.totalSpent)}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">
                  {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString("es-AR") : "—"}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    c.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-500/20 text-gray-400"
                  }`}>
                    {c.status === "active" ? "Activo" : "Inactivo"}
                  </span>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/dashboard/customers/${c._id}`} className="text-primary hover:underline text-xs">
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
          {meta.total} clientes en total.
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
          {meta.total} clientes en total.
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

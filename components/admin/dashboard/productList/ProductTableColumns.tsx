"use client";

import Image from "next/image";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ArrowUpDown, ChevronDown, ChevronRight, CameraOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IProduct } from "@/interfaces/IProduct";

/** Build a Cloudinary thumbnail URL (tiny, CDN-cached, auto-format). */
function cloudinaryThumb(url: string, size = 40): string {
  // Insert transformation before /upload/ segment
  return url.replace(
    "/upload/",
    `/upload/c_fill,w_${size},h_${size},q_auto,f_auto/`
  );
}

interface ProductTableColumnsProps {
  onEdit: (product: IProduct) => void;
  onDelete: (product: IProduct) => void;
  onCopyPrice: () => void;
}

export const ProductTableColumns = ({
  onEdit,
  onDelete,
  onCopyPrice
}: ProductTableColumnsProps): ColumnDef<IProduct>[] => [
    {
      id: "expand",
      enableHiding: false,
      header: () => null,
      cell: ({ row }) => {
        if (!row.original.hasVariants) return null;
        return (
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6 p-0"
            onClick={() => row.toggleExpanded()}
          >
            {row.getIsExpanded()
              ? <ChevronDown size={14} />
              : <ChevronRight size={14} />}
          </Button>
        );
      },
    },
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "thumbnail",
      enableHiding: false,
      enableSorting: false,
      header: () => null,
      cell: ({ row }) => {
        const gallery = row.original.gallery;
        const first = Array.isArray(gallery) && gallery.length > 0 ? gallery[0] : null;

        if (!first) {
          return (
            <div className="flex items-center justify-center w-9 h-9 rounded bg-muted/60">
              <CameraOff size={16} className="text-muted-foreground/50" />
            </div>
          );
        }

        return (
          <Image
            src={cloudinaryThumb(first.url)}
            alt={row.original.nombre}
            width={36}
            height={36}
            className="rounded object-cover"
            loading="lazy"
          />
        );
      },
      size: 52,
    },
    {
      accessorKey: "nombre",
      header: ({ column }) => {
        return (
          <span
            className="flex items-center p-0 cursor-pointer hover:text-white "
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Producto
            <ArrowUpDown size={14} className="hidden ml-2 md:block" />
          </span>
        );
      },
    },
    {
      accessorKey: "marca",
      header: ({ column }) => {
        return (
          <span
            className="flex items-center p-0 cursor-pointer hover:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Marca
            <ArrowUpDown size={14} className="hidden ml-2 md:block" />
          </span>
        );
      },
      cell: ({ row }) => {
        const marca: string = row.getValue("marca") ?? "";
        return <div className="text-left">{marca || <span className="text-muted-foreground">—</span>}</div>;
      },
    },
    {
      accessorKey: "modelo",
      header: ({ column }) => {
        return (
          <span
            className="flex items-center p-0 cursor-pointer hover:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Modelo
            <ArrowUpDown size={14} className="hidden ml-2 md:block" />
          </span>
        );
      },
      cell: ({ row }) => {
        const modelo: string = row.getValue("modelo") ?? "";
        return <div className="text-left">{modelo || <span className="text-muted-foreground">—</span>}</div>;
      },
    },
    {
      accessorKey: "listPrice",
      header: ({ column }) => {
        return (
          <span
            className="flex items-center p-0 cursor-pointer hover:text-white "
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Precio de lista
            <ArrowUpDown size={14} className="hidden ml-2 md:block" />
          </span>
        );
      },
      cell: ({ row }) => {
        const listPrice = parseFloat(row.getValue("listPrice"));
        const formatted = new Intl.NumberFormat("es-AR", {
          style: "currency",
          currency: "ARS",
        }).format(listPrice);
        return <div className="font-medium text-left">{formatted}</div>;
      },
    },
    {
      accessorKey: "publicPrice",
      meta: 'Precio al público',

      header: ({ column }) => {
        return (
          <span
            className="flex items-center p-0 cursor-pointer hover:text-white "
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Precio al público
            <ArrowUpDown size={14} className="hidden ml-2 md:block " />
          </span>
        );
      },
      cell: ({ row }) => {
        const publicPrice = parseFloat(row.getValue("publicPrice"));
        const formatted = new Intl.NumberFormat("es-AR", {
          style: "currency",
          currency: "ARS",
        }).format(publicPrice);
        return <div className="font-medium text-left">{formatted}</div>;
      },
    },
    {
      accessorKey: "categoryPath",
      header: ({ column }) => {
        return (
          <span
            className="flex items-center p-0 cursor-pointer hover:text-white "
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Categoría
            <ArrowUpDown size={14} className="hidden ml-2 md:block" />
          </span>
        );
      },
      cell: ({ row }) => {
        const path: string = row.getValue("categoryPath") ?? "";
        // convert ",electronica,computadoras,notebooks," → "electronica > computadoras > notebooks"
        const label = path.split(",").filter(Boolean).join(" > ");
        return <div className="text-left">{label}</div>;
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const product = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-8 h-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  onCopyPrice();
                  navigator.clipboard.writeText(Math.round(product.publicPrice).toString())
                }
                }
              >
                Copiar precio al público
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(product)}>
                Editar producto
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(product)}>
                Eliminar producto
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];


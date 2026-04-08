"use client";

import React, { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  getExpandedRowModel,
  ExpandedState,
} from "@tanstack/react-table";
import { IVariant } from "@/interfaces/IVariant";
import { IStock } from "@/interfaces/IStock";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductTableColumns } from "./ProductTableColumns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect } from "react";
import { TbPencilDollar } from "react-icons/tb";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IProduct } from "@/interfaces/IProduct";
import { useToast } from "@/hooks/use-toast";
import { IoIosAlert, IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CrossIcon, Loader2, Settings2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TableSmall, TableSmallBody, TableSmallCaption, TableSmallCell, TableSmallHead, TableSmallHeader, TableSmallRow } from "@/components/ui/tablesmall";
import { CgPlayListRemove } from "react-icons/cg";

interface ProductTableProps {
  data: IProduct[];
  onEdit: (product: IProduct) => void;
  onDelete: (product: IProduct) => void;
  onModifyPrices: () => void;
  onCopyPrice: () => void;
}

export function ProductTable({ data, onEdit, onDelete, onModifyPrices, onCopyPrice }: ProductTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [expanded, setExpanded] = useState<ExpandedState>({});
  type VariantWithStock = { variant: IVariant; stocks: (IStock & { branchId: { branchName: string; branchCode: string } })[] };
  const [variantsByProduct, setVariantsByProduct] = useState<Record<string, VariantWithStock[]>>({});
  const [loadingVariants, setLoadingVariants] = useState<Record<string, boolean>>({});
  const columns = ProductTableColumns({ onEdit, onDelete, onCopyPrice });
  const [openModifyPricesDialog, setOpenModifyPricesDialog] = useState(false);
  const [percent, setPercent] = useState<string | null>(null);
  const [addOrSub, setAddOrSub] = useState<string>("");
  const [itemsSelected, setItemsSelected] = useState<IProduct[]>([]);
  async function fetchVariants(productId: string) {
    if (variantsByProduct[productId] || loadingVariants[productId]) return;
    setLoadingVariants((prev) => ({ ...prev, [productId]: true }));
    try {
      const res = await fetch(`/api/stocks?productId=${productId}`);
      const data: VariantWithStock[] = await res.json();
      setVariantsByProduct((prev) => ({ ...prev, [productId]: data }));
    } finally {
      setLoadingVariants((prev) => ({ ...prev, [productId]: false }));
    }
  }

  // TABLE INSTANCE
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onExpandedChange: (updater) => {
      const next = typeof updater === "function" ? updater(expanded) : updater;
      // fetch variants for newly expanded rows
      Object.keys(next).forEach((rowId) => {
        const row = table.getRow(rowId);
        if (row && row.original.hasVariants) {
          fetchVariants(row.original._id as string);
        }
      });
      setExpanded(next);
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    state: {
      sorting,
      columnFilters,
      globalFilter,
      expanded,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  const selectedProducts = table.getFilteredSelectedRowModel().rows;
  const selected = table.getSelectedRowModel().rows;
  const { toast } = useToast();
  const [formError, setFormError] = useState(true)
  const [isSubmittingPrices, setIsSubmittingPrices] = useState(false)
  const currentPage = table.getState().pagination.pageIndex + 1; // Current page 
  const totalPages = table.getPageCount(); // number of pages

  // handle selected products
  useEffect(() => {
    console.log('selected', selected);

    if (selected.length === 0) setItemsSelected([]);
    if (selected.length > 0) {
      setItemsSelected(() => {
        return selected.map((product: any) => {
          const o = product.original;
          return {
            _id: o._id,
            nombre: o.nombre,
            marca: o.marca,
            modelo: o.modelo,
            categoryId: o.categoryId,
            categoryPath: o.categoryPath,
            publicPrice: o.publicPrice,
            listPrice: o.listPrice,
            profitPercent: o.profitPercent,
          } as IProduct;
        });
      });
    }
  }, [selected, data]);
  // handle selected products

  // form alert error timeout
  useEffect(() => {
    if (formError === true) {
      setTimeout(() => {
        setFormError(false)
      }, 4000);
    }
  }, [formError])

  async function handlePriceChange() {
    //console.log("items selected", itemsSelected)
    //console.log("percent", percent);
    //console.log("addOrSub", addOrSub);

    // VALIDAR CAMPOS DE MODIFICAR PRECIOS Y MOSTRAR ALERTAS DE FORMULARIO INCOMPLETO
    if (percent === null || addOrSub === '') {
      setFormError(true)
      return
    }

    // CERRAR MODAL MODIFICAR PRECIOS
    setOpenModifyPricesDialog(false)

    let productsUpdated: IProduct[] = []

    for (let i = 0; i < itemsSelected.length; i++) {
      const product = itemsSelected[i];
      let newListPrice: number = 0
      let newPublicPrice: number = 0

      if (addOrSub === '+') {
        newListPrice = product.listPrice * (1 + Number(percent) / 100)
        newPublicPrice = newListPrice * (1 + Number(product.profitPercent ?? 0) / 100)
      }
      if (addOrSub === '-') {
        newListPrice = product.listPrice * (1 - Number(percent) / 100)
        newPublicPrice = newListPrice * (1 + Number(product.profitPercent ?? 0) / 100)
      }
      product.publicPrice = newPublicPrice
      product.listPrice = newListPrice

      productsUpdated.push(product)
    }

    console.log('productsUpdated', productsUpdated)

    // DESELECCIONAR PRODUCTOS SELECCIONADOS PARA MODIFICAR PRECIO 
    table.toggleAllRowsSelected(false)
    // REINICIAR DATOS DE MODIFICACION DE PRECIO Y PRODUCTOS SELECCIONADOS
    setItemsSelected([])
    setPercent(null)
    setAddOrSub("")

    // FETCH GUARDAR CAMBIOS
    setIsSubmittingPrices(true)
    try {
      const saveChanges = await fetch('/api/products/editprices', {
        body: JSON.stringify(productsUpdated),
        headers: {
          "Content-Type": "application/json",
        },
        method: 'PUT'
      })
      const response = await saveChanges.json()
      console.log(response)
      onModifyPrices()
      toast({
        description: "Precios modificados con éxito",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al modificar precios.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingPrices(false)
    }
  }


  return (
    <>
      <div>
        <div className="flex items-center justify-between w-full gap-3 pt-1 pb-3">
          <Input
            placeholder="🔎︎  Buscar producto, marca o categoría..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />

          <div className="flex items-center gap-4">
            {/* boton config columnas */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex gap-3 px-2 ml-auto text-xs 2xl:p-3 2xl:text-sm ">
                  <Settings2 size={15} />
                  Columnas
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* boton config columnas */}
          </div>

        </div>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    {row.getIsExpanded() && row.original.hasVariants && (
                      <TableRow key={`${row.id}-variants`} className="bg-muted/40 hover:bg-muted/40">
                        <TableCell colSpan={columns.length} className="py-2 pl-10 pr-4">
                          {loadingVariants[row.original._id as string] ? (
                            <span className="text-xs text-muted-foreground">Cargando variantes...</span>
                          ) : (
                            <div className="flex flex-col gap-3">
                              {(variantsByProduct[row.original._id as string] ?? []).map(({ variant, stocks }) => {
                                const totalStock = stocks.reduce((sum, s) => sum + s.quantityAvailable, 0);
                                return (
                                  <div key={variant._id as string} className="flex flex-wrap gap-x-6 gap-y-1 text-xs border-b last:border-0 pb-2 last:pb-0">
                                    <span className="font-mono font-semibold">{variant.sku}</span>
                                    {Object.entries(variant.attributes ?? {}).map(([key, value]) => (
                                      <span key={key} className="text-muted-foreground">
                                        <span className="font-medium text-foreground">{key}:</span> {String(value)}
                                      </span>
                                    ))}
                                    <span className="text-muted-foreground">
                                      <span className="font-medium text-foreground">Precio:</span>{" "}
                                      {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(row.original.publicPrice + variant.priceDelta)}
                                      {variant.priceDelta !== 0 && (
                                        <span className="ml-1 opacity-60">
                                          ({new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", signDisplay: "always" }).format(variant.priceDelta)})
                                        </span>
                                      )}
                                    </span>
                                    <span className="text-muted-foreground">
                                      <span className="font-medium text-foreground">Stock:</span>{" "}
                                      <span className={totalStock === 0 ? "text-red-500 font-medium" : ""}>{totalStock}</span>
                                    </span>
                                    {variant.barcode && (
                                      <span className="text-muted-foreground">
                                        <span className="font-medium text-foreground">Barcode:</span> {variant.barcode}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No hay resultados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* desktop chart footer  */}
        <div className="flex-col items-center justify-end hidden w-full gap-8 py-4 mx-auto md:flex md:flex-row sm:justify-start">

          <div className="flex items-center gap-4 w-fit">
            <Button
              variant="outline"
              size="icon"
              className="p-1 text-sm font-light h-9 w-9"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <IoIosArrowBack size={14} />
            </Button>
            <div>
              <span className="text-sm font-semibold unselectable">Página {currentPage} de {totalPages}</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="p-1 text-sm font-light h-9 w-9"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <IoIosArrowForward size={14} />
            </Button>
          </div>

          <div className="text-sm w-fit text-muted-foreground unselectable">
            {table.getSelectedRowModel().rows.length} de{" "}
            {data.length} productos seleccionados.
          </div>
          {/* selector cantidad de productos por pagina */}
          <div className="flex flex-row items-center gap-2  text-sm">
            <span className="text-sm unselectable">Mostrar</span>
            <Select value={table.getState().pagination.pageSize.toString()}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}>
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
          {/* selector cantidad de productos por pagina */}

        </div>
        {/* desktop chart footer  */}

        {/* mobile chart footer  */}
        <div className="flex flex-col items-center justify-end w-full gap-2 py-4 mx-auto md:hidden md:flex-row sm:justify-between">
          <div className="flex-1 text-sm text-muted-foreground unselectable">
            {table.getSelectedRowModel().rows.length} de{" "}
            {data.length} productos seleccionados.
          </div>

          <div className="flex items-center justify-between w-full my-2 h-fit">
            {/* selector cantidad de productos por pagina */}
            <div className="flex flex-row items-center justify-center gap-2 mt-0 text-sm w-fit">
              <span className="text-sm unselectable">Mostrar</span>
              <Select value={table.getState().pagination.pageSize.toString()}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}>
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
            {/* selector cantidad de productos por pagina */}

            {/* controles y datos paginacion */}
            <div className="flex items-center gap-3 ">
              <Button
                variant="outline"
                size="icon"
                className="p-1 text-sm font-light h-9 w-9"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <IoIosArrowBack size={14} />
              </Button>
              <span className="text-sm font-semibold unselectable">Página {currentPage} de {totalPages}</span>
              <Button
                variant="outline"
                size="icon"
                className="p-1 text-sm font-light h-9 w-9"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <IoIosArrowForward size={14} />
              </Button>
            </div>
            {/* controles y datos paginacion */}

          </div>



        </div>
        {/* mobile chart footer  */}

      </div>

      {itemsSelected.length > 0 && (<>
        <Separator className="block my-4 md:hidden" />
        <Card style={{
          //background: '#000000a8',
          backdropFilter: 'blur(6px)'
        }} className="flex flex-col gap-2 p-4 mt-8 sm:fixed right-5 bottom-5">
          <div className="h-fit">
            <h5 className="font-bold">{table.getSelectedRowModel().rows.length} productos seleccionados</h5>
          </div>

          <TableSmall className="z-50" style={{ maxHeight: '40vh' }}>
            {/* <TableSmallCaption>{table.getSelectedRowModel().rows.length} productos seleccionados.</TableSmallCaption> */}
            <TableSmallHeader>
              <TableSmallRow>
                <TableSmallHead className="text-left w-fit">Producto</TableSmallHead>
                <TableSmallHead className="text-left w-fit">Precio de lista</TableSmallHead>
                <TableSmallHead className="text-left w-fit">Precio al público</TableSmallHead>
              </TableSmallRow>
            </TableSmallHeader>
            <TableSmallBody className="overflow-y-scroll">
              {itemsSelected.map((product) => (
                <TableSmallRow key={product._id}>
                  <TableSmallCell className="font-medium">{product.nombre}</TableSmallCell>
                  <TableSmallCell>{new Intl.NumberFormat("es-AR", {
                    style: "currency",
                    currency: "ARS",
                  }).format(product.listPrice)} </TableSmallCell>
                  <TableSmallCell> {new Intl.NumberFormat("es-AR", {
                    style: "currency",
                    currency: "ARS",
                  }).format(product.publicPrice)} </TableSmallCell>
                </TableSmallRow>
              ))}
            </TableSmallBody>

          </TableSmall>



          {/* boton modificar precios */}
          {itemsSelected.length > 0 && (
            <div className="flex flex-col justify-end w-full gap-3 md:flex-row">
              <Button
                variant="outline"
                onClick={() => {
                  //setItemsSelected([])
                  table.toggleAllRowsSelected(false)
                }}
                className="flex w-full gap-2 px-3 py-2 mt-2 sm:w-fit h-fit"
              >
                <CgPlayListRemove size={18} className="w-fit h-fit" />
                <span>Quitar selección</span>
              </Button>
              <Button
                variant="default"
                onClick={() => setOpenModifyPricesDialog(!openModifyPricesDialog)}
                className="flex w-full gap-2 px-3 py-2 mt-2 sm:w-fit h-fit"
              >
                <TbPencilDollar size={18} className="w-fit h-fit" />
                <span>Modificar precios</span>
              </Button>
            </div>
          )}
          {/* boton modificar precios */}
        </Card>
      </>)}

      {/* modal modificar precios */}
      <Dialog
        open={openModifyPricesDialog}
        onOpenChange={setOpenModifyPricesDialog}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-left">Modificar precios por porcentaje</DialogTitle>
            <DialogDescription className="text-left">
              Si queres aumentar el precio, seleccioná &quot;Aumentar
              precio&quot; o &quot;Bajar precio&quot; para bajar el precio.
              Luego ingresar el porcentaje a aplicar. El porcentaje se
              aplicará a todos los productos que seleccionaste.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-8 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name" className="">
                Aumentar o bajar precio
              </Label>
              <Select
                onValueChange={(e) => {
                  setAddOrSub(e);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="+">Aumentar precio</SelectItem>
                    <SelectItem value="-">Bajar precio</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="username" className="">
                Porcentaje
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">%</span>
                <Input
                  id="username"
                  type="number"
                  placeholder="Ingresá un porcentaje"
                  onChange={(e) => {
                    setPercent(e.target.value);
                  }}
                  className="col-span-3"
                />
              </div>
              {formError && <span className="flex items-center gap-1 mt-2 text-sm text-red-700"><IoIosAlert size={18} /> Todos los campos son obligatorios.</span>}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => { handlePriceChange(); }} disabled={isSubmittingPrices}>
              {isSubmittingPrices && <Loader2 className="animate-spin" size={16} />}
              Modificar precio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* modal modificar precios */}
    </>
  );
}


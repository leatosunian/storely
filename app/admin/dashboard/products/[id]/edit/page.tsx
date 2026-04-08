"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Package, Layers, Warehouse, ImageIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { LocaleNumberInput } from "@/components/admin/dashboard/productList/LocaleNumberInput";
import { IProduct, IProductImage } from "@/interfaces/IProduct";
import { VariantsManager } from "@/components/admin/dashboard/productList/VariantsManager";
import { ProductGallery } from "@/components/admin/dashboard/productList/ProductGallery";

// ── Helpers ───────────────────────────────────────────────────────────────────

function flattenCategories(nodes: any[], depth = 0): { _id: string; name: string; path: string; depth: number }[] {
  const result: { _id: string; name: string; path: string; depth: number }[] = [];
  for (const node of nodes) {
    result.push({ _id: node._id.toString(), name: node.name, path: node.path, depth });
    if (node.children?.length) result.push(...flattenCategories(node.children, depth + 1));
  }
  return result;
}

// ── Schema ────────────────────────────────────────────────────────────────────

const formSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  categoryId: z.string().min(1, "La categoría es requerida"),
  listPrice: z.coerce
    .number({ invalid_type_error: "Ingresá un número" })
    .positive("Debe ser mayor a 0"),
  profitPercent: z.coerce
    .number({ invalid_type_error: "Ingresá un número" })
    .min(0, "Mínimo 0"),
  marca: z.string().optional(),
  modelo: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ── Stock section (inline, self-contained) ────────────────────────────────────

interface StockEntry {
  _id: string;
  branchId: { _id: string; branchName: string; branchCode: string };
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
}

interface VariantWithStocks {
  variant: {
    _id: string;
    sku: string;
    isDefault: boolean;
    attributes: Record<string, string>;
  };
  stocks: StockEntry[];
}

function StockSection({ productId }: { productId: string }) {
  const { toast } = useToast();
  const [stockData, setStockData] = useState<VariantWithStocks[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fetchStock = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stocks?productId=${productId}`);
      if (!res.ok) throw new Error();
      const data: VariantWithStocks[] = await res.json();
      setStockData(data);
      // Initialise local edit state with current quantities
      const init: Record<string, string> = {};
      data.forEach(({ stocks }) =>
        stocks.forEach((s) => { init[s._id] = s.quantityOnHand.toString(); })
      );
      setEdits(init);
    } catch {
      setStockData([]);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { fetchStock(); }, [fetchStock]);

  async function handleSave() {
    setSaving(true);
    const failures: string[] = [];

    await Promise.allSettled(
      Object.entries(edits).map(async ([stockId, qty]) => {
        const res = await fetch("/api/stocks", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stockId, quantityOnHand: Number(qty) }),
        });
        if (!res.ok) failures.push(stockId);
      })
    );

    if (failures.length > 0) {
      toast({ description: "Algunos stocks no se pudieron actualizar.", variant: "destructive" });
    } else {
      toast({ description: "Stock actualizado correctamente." });
      await fetchStock();
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <Loader2 className="animate-spin text-muted-foreground" size={20} />
      </div>
    );
  }

  // Determine whether we're in multi-variant mode
  const isMultiVariant = stockData.length > 1 || stockData.some((d) => !d.variant.isDefault);
  const allStocks = stockData.flatMap((d) => d.stocks);

  if (allStocks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay sucursales registradas aún.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {stockData.map(({ variant, stocks }) => {
        if (stocks.length === 0) return null;

        // Variant label: only shown in multi-variant products
        const showVariantLabel = isMultiVariant;
        const variantLabel =
          variant.isDefault
            ? "Sin variante"
            : Object.entries(variant.attributes)
                .map(([k, v]) => `${k}: ${v}`)
                .join(" / ");

        return (
          <div key={variant._id}>
            {showVariantLabel && (
              <div className="flex items-center gap-2 mb-2">
                {variant.isDefault ? (
                  <Badge variant="secondary" className="text-xs">
                    {variantLabel}
                  </Badge>
                ) : (
                  <>
                    {Object.entries(variant.attributes).map(([k, v]) => (
                      <Badge key={k} variant="outline" className="text-xs font-normal gap-1">
                        <span className="text-muted-foreground">{k}:</span>
                        {v}
                      </Badge>
                    ))}
                    <span className="text-xs text-muted-foreground font-mono">
                      {variant.sku}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Branch rows */}
            <div className="rounded-md border overflow-hidden divide-y">
              {/* Header */}
              <div
                className="grid px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground"
                style={{ gridTemplateColumns: "1fr 80px 80px 100px" }}
              >
                <span>Sucursal</span>
                <span className="text-center">Reservado</span>
                <span className="text-center">Disponible</span>
                <span className="text-center">En stock</span>
              </div>

              {stocks.map((stock) => (
                <div
                  key={stock._id}
                  className="grid items-center gap-2 px-3 py-2.5"
                  style={{ gridTemplateColumns: "1fr 80px 80px 100px" }}
                >
                  <div>
                    <p className="text-sm font-medium">{stock.branchId.branchName}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {stock.branchId.branchCode}
                    </p>
                  </div>
                  <p className="text-sm text-center text-muted-foreground">
                    {stock.quantityReserved}
                  </p>
                  <p className="text-sm text-center text-muted-foreground">
                    {stock.quantityAvailable}
                  </p>
                  <div className="flex justify-center">
                    <Input
                      type="number"
                      min="0"
                      className="h-8 text-sm text-center w-20"
                      value={edits[stock._id] ?? stock.quantityOnHand.toString()}
                      onChange={(e) =>
                        setEdits((prev) => ({ ...prev, [stock._id]: e.target.value }))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="flex justify-end pt-2 border-t">
        <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="animate-spin mr-2" size={14} />}
          Guardar stock
        </Button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const { toast } = useToast();

  const [product, setProduct] = useState<IProduct | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [gallery, setGallery] = useState<IProductImage[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      categoryId: "",
      listPrice: 0,
      profitPercent: 0,
      marca: "",
      modelo: "",
    },
  });

  const watchedListPrice = form.watch("listPrice");
  const watchedProfitPercent = form.watch("profitPercent");
  const computedPublicPrice =
    watchedListPrice > 0
      ? watchedListPrice * (1 + (watchedProfitPercent || 0) / 100)
      : null;

  useEffect(() => {
    Promise.all([
      fetch("/api/categories?tree=true").then((r) => r.json()).catch(() => []),
      fetch(`/api/products/${productId}`).then((r) => (r.ok ? r.json() : Promise.reject())),
    ])
      .then(([tree, prod]) => {
        setCategories(Array.isArray(tree) ? tree : []);
        setProduct(prod);
        setGallery(Array.isArray(prod.gallery) ? prod.gallery : []);
        form.reset({
          nombre: prod.nombre ?? "",
          categoryId: prod.categoryId?.toString() ?? "",
          listPrice: prod.listPrice ?? 0,
          profitPercent: prod.profitPercent ?? 0,
          marca: prod.marca ?? "",
          modelo: prod.modelo ?? "",
        });
      })
      .catch(() => {
        toast({ description: "No se pudo cargar el producto.", variant: "destructive" });
        router.push("/admin/dashboard/products");
      })
      .finally(() => setLoadingProduct(false));
  }, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

  const flatCats = flattenCategories(categories);

  const handleSubmit = async (values: FormValues) => {
    const selectedCat = flatCats.find((c) => c._id === values.categoryId);
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          categoryPath: selectedCat?.path ?? product?.categoryPath ?? "",
          gallery,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.msg || "Error al actualizar el producto");
      }
      const updated = await res.json();
      setProduct(updated);
      toast({ description: `¡Producto "${values.nombre}" actualizado!` });
    } catch (err: any) {
      toast({ description: err.message || "Error al actualizar.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loader" />
      </div>
    );
  }

  return (
    <>
      {/* ── Header ── */}
      <div className="flex flex-col gap-2 mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink className="text-xs" asChild>
                <Link href="/admin/dashboard/products">Inicio</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink className="text-xs" asChild>
                <Link href="/admin/dashboard/products">Productos</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-xs">{product?.nombre ?? "Editar"}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h2 className="text-2xl font-semibold">Editar producto</h2>
        <p className="text-sm text-muted-foreground">
          Modificá los datos del producto, sus variantes y el stock por sucursal.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="max-w-2xl space-y-6">

            {/* ── Datos básicos ─────────────────────────────────────────── */}
            <div className="border rounded-lg p-6 bg-background space-y-5">
              <div className="flex items-center gap-2">
                <Package size={17} className="text-muted-foreground" />
                <h3 className="text-sm font-semibold">Datos del producto</h3>
              </div>

              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del producto</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. BIOBIZZ CALMAG (500 ML)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {flatCats.map((cat) => (
                          <SelectItem key={cat._id} value={cat._id}>
                            {"\u00a0".repeat(cat.depth * 3)}
                            {cat.depth > 0 ? "└ " : ""}
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="marca"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Marca{" "}
                        <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. Samsung" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="modelo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Modelo{" "}
                        <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. XR-500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* ── Precios ───────────────────────────────────────────────── */}
            <div className="border rounded-lg p-6 bg-background space-y-5">
              <h3 className="text-sm font-semibold">Precios</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="listPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio de lista</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground font-semibold shrink-0">$</span>
                          <LocaleNumberInput
                            placeholder="0,00"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="profitPercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>% Ganancia</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground font-semibold shrink-0">%</span>
                          <LocaleNumberInput
                            placeholder="30"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {computedPublicPrice !== null && (
                <div className="flex items-center justify-between rounded-md bg-muted/40 px-4 py-3 border">
                  <span className="text-sm text-muted-foreground">Precio al público estimado</span>
                  <span className="text-base font-semibold">
                    {new Intl.NumberFormat("es-AR", {
                      style: "currency",
                      currency: "ARS",
                    }).format(computedPublicPrice)}
                  </span>
                </div>
              )}
            </div>

            {/* ── Submit ────────────────────────────────────────────────── */}
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/dashboard/products")}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin mr-2" size={16} />}
                Guardar cambios
              </Button>
            </div>
          </div>
        </form>
      </Form>

      {/* ── Galería de imágenes ─────────────────────────────────────────── */}
      <div className="max-w-2xl mt-6">
        <div className="border rounded-lg p-6 bg-background space-y-4">
          <div className="flex items-center gap-2">
            <ImageIcon size={17} className="text-muted-foreground" />
            <div>
              <h3 className="text-sm font-semibold">Imágenes</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Subí fotos del producto. La primera será la imagen principal.
              </p>
            </div>
          </div>
          <Separator />
          <ProductGallery value={gallery} onChange={setGallery} />
        </div>
      </div>

      {/* ── Variantes ─────────────────────────────────────────────────────── */}
      <div className="max-w-2xl mt-6">
        <div className="border rounded-lg p-6 bg-background space-y-4">
          <div className="flex items-center gap-2">
            <Layers size={17} className="text-muted-foreground" />
            <div>
              <h3 className="text-sm font-semibold">Variantes</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Administrá las variantes del producto (talle, color, etc.).
              </p>
            </div>
          </div>
          <Separator />
          <VariantsManager productId={productId} />
        </div>
      </div>

      {/* ── Stock ─────────────────────────────────────────────────────────── */}
      <div className="max-w-2xl mt-6 mb-10">
        <div className="border rounded-lg p-6 bg-background space-y-4">
          <div className="flex items-center gap-2">
            <Warehouse size={17} className="text-muted-foreground" />
            <div>
              <h3 className="text-sm font-semibold">Stock por sucursal</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ajustá las unidades en stock por variante y sucursal.
              </p>
            </div>
          </div>
          <Separator />
          <StockSection productId={productId} />
        </div>
      </div>
    </>
  );
}

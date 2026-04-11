"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Layers, Warehouse, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProductGallery } from "@/components/admin/dashboard/products/ProductGallery";
import { LocaleNumberInput } from "@/components/admin/dashboard/products/LocaleNumberInput";
import {
  VariantsBuilder,
  VariantRow,
} from "@/components/admin/dashboard/products/create/VariantsBuilder";
import {
  StockInitializer,
  StockInputMap,
  Branch,
} from "@/components/admin/dashboard/products/create/StockInitializer";
import { IAttributeDefinition, IProductImage } from "@/interfaces/IProduct";

// ── Helpers ──────────────────────────────────────────────────────────────────

function flattenCategories(
  nodes: any[],
  depth = 0
): { _id: string; name: string; path: string; depth: number }[] {
  const result: { _id: string; name: string; path: string; depth: number }[] =
    [];
  for (const node of nodes) {
    result.push({
      _id: node._id.toString(),
      name: node.name,
      path: node.path,
      depth,
    });
    if (node.children?.length)
      result.push(...flattenCategories(node.children, depth + 1));
  }
  return result;
}

async function applyInitialStock(
  productId: string,
  stockInput: StockInputMap,
  hasVariants: boolean,
  variantRows: VariantRow[]
) {
  const hasAny = Object.values(stockInput).some((q) => q > 0);
  if (!hasAny) return;

  const res = await fetch(`/api/stocks?productId=${productId}`);
  if (!res.ok) return;

  type StockEntry = {
    _id: string;
    branchId: { _id: string };
    quantityOnHand: number;
  };
  type VariantWithStocks = {
    variant: {
      _id: string;
      isDefault: boolean;
      attributes: Record<string, string>;
    };
    stocks: StockEntry[];
  };

  const data: VariantWithStocks[] = await res.json();

  const updates: Promise<void>[] = [];

  data.forEach(({ variant, stocks }) => {
    stocks.forEach((stock) => {
      let mapKey: string;

      if (hasVariants && !variant.isDefault) {
        const row = variantRows.find(
          (r) =>
            JSON.stringify(Object.entries(r.attributes).sort()) ===
            JSON.stringify(Object.entries(variant.attributes).sort())
        );
        mapKey = row ? `${row._key}:${stock.branchId._id}` : "";
      } else {
        mapKey = `default:${stock.branchId._id}`;
      }

      const qty = stockInput[mapKey];
      if (qty && qty > 0) {
        updates.push(
          fetch("/api/stocks", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stockId: stock._id, quantityOnHand: qty }),
          }).then(() => { })
        );
      }
    });
  });

  await Promise.allSettled(updates);
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
  internalCode: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ── Component ────────────────────────────────────────────────────────────────

export default function CreateProductForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Catalogue data
  const [categories, setCategories] = useState<any[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Variants section
  const [hasVariants, setHasVariants] = useState(false);
  const [variantRows, setVariantRows] = useState<VariantRow[]>([]);
  const [attributeSchema, setAttributeSchema] = useState<
    IAttributeDefinition[]
  >([]);

  // Gallery
  const [gallery, setGallery] = useState<IProductImage[]>([]);

  // Stock section
  const [stockInput, setStockInput] = useState<StockInputMap>({});

  useEffect(() => {
    Promise.all([
      fetch("/api/categories?tree=true")
        .then((r) => r.json())
        .catch(() => []),
      fetch("/api/branches")
        .then((r) => r.json())
        .catch(() => ({ branches: [] })),
    ]).then(([tree, branchRes]) => {
      setCategories(Array.isArray(tree) ? tree : []);
      setBranches(Array.isArray(branchRes.branches) ? branchRes.branches : []);
    });
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      categoryId: "",
      listPrice: "" as unknown as number,
      profitPercent: "" as unknown as number,
      marca: "",
      modelo: "",
      internalCode: "",
    },
  });

  const watchedListPrice = form.watch("listPrice");
  const watchedProfitPercent = form.watch("profitPercent");
  const computedPublicPrice =
    watchedListPrice > 0
      ? watchedListPrice * (1 + (watchedProfitPercent || 0) / 100)
      : null;

  const flatCats = flattenCategories(categories);

  const handleSubmit = async (values: FormValues) => {
    if (hasVariants && variantRows.length === 0) {
      toast({
        description:
          "Agregá al menos una variante o desactivá el modo variantes.",
        variant: "destructive",
      });
      return;
    }

    const selectedCat = flatCats.find((c) => c._id === values.categoryId);
    setIsSubmitting(true);

    try {
      const payload = {
        nombre: values.nombre,
        categoryId: values.categoryId,
        categoryPath: selectedCat?.path ?? "",
        listPrice: values.listPrice,
        profitPercent: values.profitPercent,
        marca: values.marca || undefined,
        modelo: values.modelo || undefined,
        internalCode: values.internalCode || undefined,
        hasVariants,
        attributeSchema: hasVariants ? attributeSchema : [],
        variants: hasVariants ? variantRows : undefined,
        gallery,
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.msg || "Error al crear el producto");
      }

      const created = await res.json();

      await applyInitialStock(
        created._id.toString(),
        stockInput,
        hasVariants,
        variantRows
      );

      toast({ description: `¡Producto "${values.nombre}" creado con éxito!` });
      router.push("/admin/dashboard/products");
    } catch (err: any) {
      toast({
        description: err.message || "Error al crear el producto.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
                    <Input
                      placeholder="Ej. BIOBIZZ CALMAG (500 ML)"
                      {...field}
                    />
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
                      <span className="text-muted-foreground text-xs font-normal">
                        (opcional)
                      </span>
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
                      <span className="text-muted-foreground text-xs font-normal">
                        (opcional)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. XR-500" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="internalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código interno {" "}
                    <span className="text-muted-foreground text-xs font-normal">
                      (opcional)
                    </span></FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. INT-00123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* ── Galería de imágenes ─────────────────────────────────── */}
          <div className="border rounded-lg p-6 bg-background space-y-5">
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
                        <span className="text-sm text-muted-foreground font-semibold shrink-0">
                          $
                        </span>
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
                        <span className="text-sm text-muted-foreground font-semibold shrink-0">
                          %
                        </span>
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
                <span className="text-sm text-muted-foreground">
                  Precio al público estimado
                </span>
                <span className="text-base font-semibold">
                  {new Intl.NumberFormat("es-AR", {
                    style: "currency",
                    currency: "ARS",
                  }).format(computedPublicPrice)}
                </span>
              </div>
            )}
          </div>

          {/* ── Variantes ─────────────────────────────────────────────── */}
          <div className="border rounded-lg p-6 bg-background space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={17} className="text-muted-foreground" />
                <div>
                  <h3 className="text-sm font-semibold">Variantes</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Activá si el producto tiene talle, color u otros atributos.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasVariants && variantRows.length > 0 && (
                  <Badge variant="secondary">{variantRows.length}</Badge>
                )}
                <Switch
                  checked={hasVariants}
                  onCheckedChange={setHasVariants}
                />
              </div>
            </div>

            {hasVariants && (
              <>
                <Separator />
                <VariantsBuilder
                  productName={form.watch("nombre")}
                  basePrice={computedPublicPrice ?? undefined}
                  onChange={(rows, schema) => {
                    setVariantRows(rows);
                    setAttributeSchema(schema);
                    setStockInput({});
                  }}
                />
                {variantRows.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Definí al menos un atributo con valores para generar
                    variantes.
                  </p>
                )}
              </>
            )}
          </div>

          {/* ── Stock inicial ──────────────────────────────────────────── */}
          <div className="border rounded-lg p-6 bg-background space-y-4">
            <div className="flex items-center gap-2">
              <Warehouse size={17} className="text-muted-foreground" />
              <div>
                <h3 className="text-sm font-semibold">Stock inicial</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {hasVariants && variantRows.length > 0
                    ? "Ingresá las unidades iniciales por variante y sucursal."
                    : "Ingresá las unidades iniciales por sucursal."}
                </p>
              </div>
            </div>

            <Separator />

            <StockInitializer
              hasVariants={hasVariants}
              variantRows={variantRows}
              branches={branches}
              value={stockInput}
              onChange={setStockInput}
            />
          </div>

          {/* ── Actions ───────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 pb-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/dashboard/products")}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="animate-spin mr-2" size={16} />
              )}
              Crear producto
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
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
import { useToast } from "@/hooks/use-toast";
import { LocaleNumberInput } from "@/components/admin/dashboard/products/LocaleNumberInput";
import { IProduct, IProductImage } from "@/interfaces/IProduct";
import { VariantsManager } from "@/components/admin/dashboard/products/VariantsManager";
import { ProductGallery } from "@/components/admin/dashboard/products/ProductGallery";
import StockSection from "@/components/admin/dashboard/products/edit/StockSection";

// Helpers
function flattenCategories(
  nodes: any[],
  depth = 0
): { _id: string; name: string; path: string; depth: number }[] {
  const result: { _id: string; name: string; path: string; depth: number }[] =
    [];
  for (const node of nodes) {
    result.push({ _id: node._id.toString(), name: node.name, path: node.path, depth });
    if (node.children?.length)
      result.push(...flattenCategories(node.children, depth + 1));
  }
  return result;
}

// Zod schema
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

interface EditProductFormProps {
  productId: string;
}

export default function EditProductForm({ productId }: EditProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [product, setProduct] = useState<IProduct | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [gallery, setGallery] = useState<IProductImage[]>([]);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const pendingNavigation = useRef<string | null>(null);
  const isPopstateNav = useRef(false);
  const hasGuardRef = useRef(false);
  const initialGalleryRef = useRef<IProductImage[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      categoryId: "",
      listPrice: 0,
      profitPercent: 0,
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

  useEffect(() => {
    Promise.all([
      fetch("/api/categories?tree=true")
        .then((r) => r.json())
        .catch(() => []),
      fetch(`/api/products/${productId}`).then((r) =>
        r.ok ? r.json() : Promise.reject()
      ),
    ])
      .then(([tree, prod]) => {
        setCategories(Array.isArray(tree) ? tree : []);
        setProduct(prod);
        const initialGallery = Array.isArray(prod.gallery) ? prod.gallery : [];
        setGallery(initialGallery);
        initialGalleryRef.current = initialGallery;
        form.reset({
          nombre: prod.nombre ?? "",
          categoryId: prod.categoryId?.toString() ?? "",
          listPrice: prod.listPrice ?? 0,
          profitPercent: prod.profitPercent ?? 0,
          marca: prod.marca ?? "",
          modelo: prod.modelo ?? "",
          internalCode: prod.internalCode ?? "",
        });
      })
      .catch(() => {
        toast({
          description: "No se pudo cargar el producto.",
          variant: "destructive",
        });
        router.push("/admin/dashboard/products");
      })
      .finally(() => setLoadingProduct(false));
  }, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

  const flatCats = flattenCategories(categories);

  const galleryChanged =
    JSON.stringify(gallery) !== JSON.stringify(initialGalleryRef.current);
  const hasUnsavedChanges = form.formState.isDirty || galleryChanged;

  const dirtyRef = useRef(false);
  dirtyRef.current = hasUnsavedChanges;

  useEffect(() => {
    if (hasUnsavedChanges && !hasGuardRef.current) {
      window.history.pushState(
        { __unsavedGuard: true },
        "",
        window.location.href
      );
      hasGuardRef.current = true;
    }
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#")) return;
      if (href === window.location.pathname) return;
      if (dirtyRef.current) {
        e.preventDefault();
        e.stopPropagation();
        isPopstateNav.current = false;
        pendingNavigation.current = href;
        setShowUnsavedDialog(true);
      }
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      if (!dirtyRef.current) return;
      window.history.pushState(
        { __unsavedGuard: true },
        "",
        window.location.href
      );
      isPopstateNav.current = true;
      pendingNavigation.current = null;
      setShowUnsavedDialog(true);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateAway = (href: string) => {
    if (hasUnsavedChanges) {
      isPopstateNav.current = false;
      pendingNavigation.current = href;
      setShowUnsavedDialog(true);
    } else {
      router.push(href);
    }
  };

  const discardAndNavigate = () => {
    form.reset();
    initialGalleryRef.current = gallery;
    dirtyRef.current = false;
    hasGuardRef.current = false;
    setShowUnsavedDialog(false);

    if (isPopstateNav.current) {
      isPopstateNav.current = false;
      window.history.go(-2);
    } else if (pendingNavigation.current) {
      router.push(pendingNavigation.current);
      pendingNavigation.current = null;
    }
  };

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
      initialGalleryRef.current = gallery;
      form.reset(values);
      toast({ description: `¡Producto "${values.nombre}" actualizado!` });
    } catch (err: any) {
      toast({
        description: err.message || "Error al actualizar.",
        variant: "destructive",
      });
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
      {/* Header */}
      <div className="flex flex-col gap-2 mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                className="text-xs cursor-pointer"
                onClick={() => navigateAway("/admin/dashboard/products")}
              >
                Inicio
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                className="text-xs cursor-pointer"
                onClick={() => navigateAway("/admin/dashboard/products")}
              >
                Productos
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-xs">
                {product?.nombre ?? "Editar"}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h2 className="text-2xl font-semibold">Editar producto</h2>
        <p className="text-sm text-muted-foreground">
          Modificá los datos del producto, sus variantes y el stock por sucursal.
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>

          {/* Two-column layout: Gallery (left) + Product data (right) */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6">

            {/* Left column: Gallery */}
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

            {/* Right column: Product data + Prices */}
            <div className="space-y-6">

              {/* Datos básicos */}
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
                      <FormLabel>
                        Código interno{" "}
                        <span className="text-muted-foreground text-xs font-normal">
                          (opcional)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. INT-00123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Precios */}
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
                            <LocaleNumberInput placeholder="0,00" {...field} />
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
                            <LocaleNumberInput placeholder="30" {...field} />
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
            </div>
          </div>

          {/* Variantes */}
          <div className="mt-6">
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

          {/* Stock */}
          <div className="mt-6 mb-20">
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

          {/* Sticky bottom bar */}
          <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="flex items-center justify-end gap-3 px-6 py-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigateAway("/admin/dashboard/products")}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="animate-spin mr-2" size={16} />
                )}
                Guardar cambios
              </Button>
            </div>
          </div>
        </form>
      </Form>

      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cambios sin guardar</AlertDialogTitle>
            <AlertDialogDescription>
              Realizaste cambios que no fueron guardados. ¿Querés guardarlos
              antes de salir?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <AlertDialogCancel
              onClick={() => {
                pendingNavigation.current = null;
                isPopstateNav.current = false;
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={discardAndNavigate}
            >
              Descartar
            </Button>
            <AlertDialogAction
              onClick={() => {
                const wasPopstate = isPopstateNav.current;
                const target = pendingNavigation.current;
                setShowUnsavedDialog(false);
                form.handleSubmit(async (values) => {
                  await handleSubmit(values);
                  hasGuardRef.current = false;
                  if (wasPopstate) {
                    isPopstateNav.current = false;
                    window.history.go(-2);
                  } else if (target) {
                    router.push(target);
                    pendingNavigation.current = null;
                  }
                })();
              }}
            >
              Guardar cambios
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

"use client";

import { useState, useMemo } from "react";
import { Search, Package, Check, ArrowLeft, Loader2, Tag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export interface ProductOption {
  _id: string;
  nombre: string;
  marca?: string;
  modelo?: string;
  internalCode?: string;
  publicPrice: number;
  hasVariants: boolean;
  gallery?: { url: string; publicId: string; width: number; height: number }[];
}

export interface VariantOption {
  _id: string;
  sku: string;
  attributes: Record<string, string>;
  isDefault: boolean;
  priceDelta: number;
  customPrice?: number;
}

export interface ProductSelection {
  product: ProductOption;
  variant?: VariantOption;
  availableStock?: number;
}

interface ProductPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: ProductOption[];
  onSelect: (selection: ProductSelection) => void;
  selectedProductId?: string;
  selectedVariantId?: string;
  branchId?: string;
}

function getVariantPrice(variant: VariantOption, basePrice: number): number {
  return variant.customPrice ?? basePrice + variant.priceDelta;
}

function formatAttributes(attrs: Record<string, string>): string {
  return Object.entries(attrs)
    .map(([, v]) => v)
    .join(" / ");
}

export default function ProductPickerModal({
  open,
  onOpenChange,
  products,
  onSelect,
  selectedProductId,
  selectedVariantId,
  branchId,
}: ProductPickerModalProps) {
  const [search, setSearch] = useState("");
  const [step, setStep] = useState<"products" | "variants">("products");
  const [pendingProduct, setPendingProduct] = useState<ProductOption | null>(null);
  const [variants, setVariants] = useState<VariantOption[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);

  // Stock states
  const [checkingProductId, setCheckingProductId] = useState<string | null>(null);
  const [outOfStockProductIds, setOutOfStockProductIds] = useState<Set<string>>(new Set());
  // variantId → quantityAvailable at the selected branch
  const [variantStocks, setVariantStocks] = useState<Record<string, number>>({});
  // true once stock data has been successfully fetched for the current variant step
  const [stockLoaded, setStockLoaded] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.marca && p.marca.toLowerCase().includes(q)) ||
        (p.modelo && p.modelo.toLowerCase().includes(q)) ||
        (p.internalCode && p.internalCode.toLowerCase().includes(q))
    );
  }, [search, products]);

  async function handleProductClick(product: ProductOption) {
    if (!product.hasVariants) {
      // Stock check for non-variant products when a branch is selected
      if (branchId) {
        setCheckingProductId(product._id);
        let available: number | undefined;
        try {
          const res = await fetch(`/api/stocks?productId=${product._id}&branchId=${branchId}`);
          const data = await res.json();
          available = data?.totalAvailable ?? 0;
          if (available === 0) {
            setOutOfStockProductIds((prev) => new Set([...prev, product._id]));
            return;
          }
        } catch {
          // Graceful degradation: allow selection if stock check fails
        } finally {
          setCheckingProductId(null);
        }
        onSelect({ product, availableStock: available });
      } else {
        onSelect({ product });
      }
      closeAndReset();
      return;
    }

    // Product with variants
    setPendingProduct(product);
    setStep("variants");
    setLoadingVariants(true);
    setVariantStocks({});
    setStockLoaded(false);

    const fetchVariants = fetch(`/api/products/${product._id}/variants`).then((r) => r.json());
    const fetchStock = branchId
      ? fetch(`/api/stocks?productId=${product._id}&branchId=${branchId}`)
          .then((r) => r.json())
          .catch(() => null)
      : Promise.resolve(null);

    Promise.all([fetchVariants, fetchStock])
      .then(([variantsData, stockData]) => {
        setVariants(Array.isArray(variantsData) ? variantsData : []);
        if (stockData?.byVariant) {
          const map: Record<string, number> = {};
          (stockData.byVariant as Array<{ variantId: string; available: number }>).forEach((v) => {
            map[String(v.variantId)] = v.available;
          });
          setVariantStocks(map);
          setStockLoaded(true);
        }
      })
      .catch(() => {
        setVariants([]);
      })
      .finally(() => setLoadingVariants(false));
  }

  function handleVariantClick(variant: VariantOption) {
    if (!pendingProduct) return;
    // Block if branch is set, stock loaded, and this variant has no stock
    if (branchId && stockLoaded && (variantStocks[variant._id] ?? 0) === 0) return;
    const availableStock =
      branchId && stockLoaded ? (variantStocks[variant._id] ?? 0) : undefined;
    onSelect({ product: pendingProduct, variant, availableStock });
    closeAndReset();
  }

  function handleBack() {
    setStep("products");
    setPendingProduct(null);
    setVariants([]);
    setVariantStocks({});
    setStockLoaded(false);
  }

  function closeAndReset() {
    onOpenChange(false);
    setTimeout(() => {
      setSearch("");
      setStep("products");
      setPendingProduct(null);
      setVariants([]);
      setCheckingProductId(null);
      setOutOfStockProductIds(new Set());
      setVariantStocks({});
      setStockLoaded(false);
    }, 200);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) closeAndReset();
    else onOpenChange(true);
  }

  // ── Product list step ────────────────────────────────────────────────────────
  const productListContent = (
    <>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          autoFocus
          placeholder="Buscar por nombre, marca, modelo o código interno..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <p className="text-xs text-muted-foreground -mt-1">
        {filtered.length} producto{filtered.length !== 1 ? "s" : ""} encontrado
        {filtered.length !== 1 ? "s" : ""}
      </p>

      <div className="overflow-y-auto max-h-[420px] space-y-1 pr-1 -mr-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
            <Package className="h-10 w-10 mb-3 opacity-25" />
            <p className="text-sm">No se encontraron productos</p>
            <p className="text-xs mt-1 opacity-70">Intentá con otro término de búsqueda</p>
          </div>
        ) : (
          filtered.map((product) => {
            const isChecking = checkingProductId === product._id;
            const isOutOfStock = outOfStockProductIds.has(product._id);
            const isSelected = product._id === selectedProductId && !product.hasVariants;
            const thumbnail = product.gallery?.[0]?.url;

            return (
              <button
                key={product._id}
                type="button"
                disabled={isChecking || isOutOfStock}
                onClick={() => handleProductClick(product)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isOutOfStock
                    ? "opacity-50 cursor-not-allowed border border-transparent"
                    : isSelected
                    ? "bg-primary/10 border border-primary/30 hover:bg-primary/15"
                    : "hover:bg-accent border border-transparent"
                }`}
              >
                {/* Thumbnail */}
                <div className="flex-shrink-0 h-12 w-12 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                  {thumbnail ? (
                    <Image
                      src={thumbnail}
                      alt={product.nombre}
                      width={48}
                      height={48}
                      className="object-cover h-full w-full"
                    />
                  ) : (
                    <Package className="h-5 w-5 text-muted-foreground opacity-40" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{product.nombre}</p>
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-0.5">
                    {product.marca && (
                      <span className="text-xs text-muted-foreground">{product.marca}</span>
                    )}
                    {product.modelo && (
                      <span className="text-xs text-muted-foreground">
                        {product.marca ? "·" : ""} {product.modelo}
                      </span>
                    )}
                    {product.internalCode && (
                      <Badge variant="secondary" className="text-xs py-0 px-1.5 h-4 font-mono">
                        {product.internalCode}
                      </Badge>
                    )}
                    {product.hasVariants && (
                      <Badge variant="outline" className="text-xs py-0 px-1.5 h-4">
                        Con variantes
                      </Badge>
                    )}
                    {isOutOfStock && (
                      <Badge variant="destructive" className="text-xs py-0 px-1.5 h-4">
                        Sin stock
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Price + indicator */}
                <div className="flex-shrink-0 flex items-center gap-2 pl-2">
                  <span className="text-sm font-semibold tabular-nums">
                    ${product.publicPrice.toLocaleString("es-AR")}
                  </span>
                  {isChecking ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : isSelected ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <div className="h-4 w-4" />
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </>
  );

  // ── Variant picker step ──────────────────────────────────────────────────────
  const variantContent = pendingProduct && (
    <>
      {/* Back + product info */}
      <div className="flex items-center gap-2 -mt-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{pendingProduct.nombre}</p>
          {(pendingProduct.marca || pendingProduct.modelo) && (
            <p className="text-xs text-muted-foreground truncate">
              {[pendingProduct.marca, pendingProduct.modelo].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground -mt-1">
        Seleccioná una variante para este producto
      </p>

      <div className="overflow-y-auto max-h-[420px] space-y-1.5 pr-1 -mr-1">
        {loadingVariants ? (
          <div className="flex items-center justify-center py-14 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-sm">Cargando variantes...</span>
          </div>
        ) : variants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
            <Tag className="h-10 w-10 mb-3 opacity-25" />
            <p className="text-sm">No hay variantes disponibles</p>
          </div>
        ) : (
          variants.map((variant) => {
            const isSelected = variant._id === selectedVariantId;
            const price = getVariantPrice(variant, pendingProduct.publicPrice);
            const hasCustomPrice = variant.customPrice != null;
            const hasDelta = !hasCustomPrice && variant.priceDelta !== 0;
            const attrLabel = formatAttributes(variant.attributes);

            // Stock display: only when branchId is set and stock has been loaded
            const showStock = Boolean(branchId) && stockLoaded;
            const stockQty = showStock ? (variantStocks[variant._id] ?? 0) : undefined;
            const isOutOfStock = stockQty !== undefined && stockQty === 0;

            return (
              <button
                key={variant._id}
                type="button"
                disabled={isOutOfStock}
                onClick={() => handleVariantClick(variant)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isOutOfStock
                    ? "opacity-50 cursor-not-allowed border border-transparent"
                    : isSelected
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-accent border border-transparent"
                }`}
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  {attrLabel ? (
                    <p className="text-sm font-medium">{attrLabel}</p>
                  ) : (
                    <p className="text-sm font-medium text-muted-foreground italic">Variante estándar</p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5 min-w-0 flex-wrap">
                    <span className="text-xs font-mono text-muted-foreground truncate">
                      {variant.sku}
                    </span>
                    {hasDelta && (
                      <span
                        className={`text-xs flex-shrink-0 tabular-nums ${
                          variant.priceDelta > 0 ? "text-emerald-500" : "text-rose-500"
                        }`}
                      >
                        {variant.priceDelta > 0 ? "+" : ""}
                        {variant.priceDelta.toLocaleString("es-AR")}
                      </span>
                    )}
                    {hasCustomPrice && (
                      <Badge variant="outline" className="text-xs py-0 px-1.5 h-4 flex-shrink-0">
                        Precio personalizado
                      </Badge>
                    )}
                    {stockQty !== undefined && (
                      <Badge
                        variant={isOutOfStock ? "destructive" : "secondary"}
                        className="text-xs py-0 px-1.5 h-4 flex-shrink-0"
                      >
                        {isOutOfStock ? "Sin stock" : `${stockQty} en stock`}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="flex-shrink-0 flex items-center gap-2 pl-2">
                  <span className="text-sm font-semibold tabular-nums">
                    ${price.toLocaleString("es-AR")}
                  </span>
                  {isSelected ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <div className="h-4 w-4" />
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>
            {step === "products" ? "Seleccionar producto" : "Seleccionar variante"}
          </DialogTitle>
        </DialogHeader>

        {step === "products" ? productListContent : variantContent}
      </DialogContent>
    </Dialog>
  );
}

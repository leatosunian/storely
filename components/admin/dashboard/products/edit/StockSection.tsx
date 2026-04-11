import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

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

export default function StockSection({ productId }: { productId: string }) {
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
"use client";

/**
 * VariantsBuilder
 *
 * UX flow:
 * 1. User defines attribute axes: e.g.  Color → [Rojo, Azul]  /  Talle → [S, M, L]
 * 2. Component auto-generates the cartesian product as rows
 * 3. User can edit SKU, price delta and barcode per row
 * 4. Parent receives the final array via onChange
 */

import React, { useEffect, useId, useRef, useState } from "react";
import { Plus, Trash2, RefreshCw, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { IAttributeDefinition } from "@/interfaces/IProduct";

export interface VariantRow {
  /** local key used for React lists — not sent to API */
  _key: string;
  sku: string;
  attributes: Record<string, string>;
  priceDelta: number;
  barcode?: string;
}

interface AttributeAxis {
  id: string;
  key: string;        // e.g. "Color"
  valuesRaw: string;  // comma-separated values string
}

interface VariantsBuilderProps {
  productName?: string;
  onChange: (variants: VariantRow[], attributeSchema: IAttributeDefinition[]) => void;
}

// ── Pure helpers ─────────────────────────────────────────────────────────────

function cartesian(arrays: string[][]): string[][] {
  if (arrays.length === 0) return [[]];
  return arrays.reduce<string[][]>(
    (acc, arr) => acc.flatMap((prefix) => arr.map((v) => [...prefix, v])),
    [[]]
  );
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildRows(axes: AttributeAxis[], productName: string, existing: VariantRow[]): VariantRow[] {
  const validAxes = axes.filter((a) => a.key.trim() && a.valuesRaw.trim());
  if (validAxes.length === 0) return [];

  const keys = validAxes.map((a) => a.key.trim());
  const valueSets = validAxes.map((a) =>
    a.valuesRaw.split(",").map((v) => v.trim()).filter(Boolean)
  );
  const combos = cartesian(valueSets);

  return combos.map((combo) => {
    const attributes: Record<string, string> = {};
    keys.forEach((k, i) => (attributes[k] = combo[i]));

    const comboKey = combo.map(slugify).join("-");
    const autoSku = `${slugify(productName || "prod")}-${comboKey}`.toUpperCase();

    const existingRow = existing.find(
      (r) =>
        JSON.stringify(Object.entries(r.attributes).sort()) ===
        JSON.stringify(Object.entries(attributes).sort())
    );

    return {
      _key: comboKey,
      sku: existingRow ? existingRow.sku : autoSku,
      attributes,
      priceDelta: existingRow ? existingRow.priceDelta : 0,
      barcode: existingRow ? existingRow.barcode : "",
    };
  });
}

function buildSchema(axes: AttributeAxis[]): IAttributeDefinition[] {
  return axes
    .filter((a) => a.key.trim() && a.valuesRaw.trim())
    .map((a, i) => ({
      key: a.key.trim(),
      label: a.key.trim(),
      values: a.valuesRaw.split(",").map((v) => v.trim()).filter(Boolean),
      order: i,
    }));
}

// ── Component ─────────────────────────────────────────────────────────────────

export function VariantsBuilder({ productName = "", onChange }: VariantsBuilderProps) {
  const uid = useId();
  const [axes, setAxes] = useState<AttributeAxis[]>([
    { id: `${uid}-0`, key: "", valuesRaw: "" },
  ]);
  const [rows, setRows] = useState<VariantRow[]>([]);

  // Keep a stable ref to onChange so the effect below doesn't re-run when the
  // parent re-renders and passes a new function reference.
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; });

  // ── Rebuild rows when axes / productName change ──────────────────────────
  // NOTE: do NOT call onChange inside setRows — that would be setState-during-render.
  useEffect(() => {
    setRows((prev) => buildRows(axes, productName, prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axes, productName]);

  // ── Notify parent AFTER rows state has been committed ───────────────────
  // This effect runs after every committed render where rows or axes changed.
  useEffect(() => {
    onChangeRef.current(rows, buildSchema(axes));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, axes]);

  // ── Axis management ───────────────────────────────────────────────────────

  function addAxis() {
    setAxes((prev) => [
      ...prev,
      { id: `${uid}-${Date.now()}`, key: "", valuesRaw: "" },
    ]);
  }

  function removeAxis(id: string) {
    setAxes((prev) => prev.filter((a) => a.id !== id));
  }

  function updateAxis(id: string, field: "key" | "valuesRaw", value: string) {
    setAxes((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  }

  // ── Row editing ───────────────────────────────────────────────────────────
  // Plain setRows — the "notify parent" effect fires afterwards automatically.

  function updateRow(key: string, field: keyof VariantRow, value: string | number) {
    setRows((prev) => prev.map((r) => (r._key === key ? { ...r, [field]: value } : r)));
  }

  function regenerateSkus() {
    setRows((prev) =>
      prev.map((r) => {
        const comboKey = Object.values(r.attributes).map(slugify).join("-");
        return { ...r, sku: `${slugify(productName || "prod")}-${comboKey}`.toUpperCase() };
      })
    );
  }

  const hasMatrix = rows.length > 0;

  return (
    <div className="space-y-5">
      {/* ── Attribute axes ─────────────────────────────────────────────── */}
      <div>
        {/* FIX: use <div> not <p> — <p> cannot contain block-level children */}
        <div className="text-sm font-medium mb-3">
          Atributos{" "}
          <span className="text-muted-foreground font-normal">(ej. Color, Talle)</span>
        </div>

        <div className="space-y-3">
          {axes.map((axis, idx) => (
            <div key={axis.id} className="flex items-start gap-2">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <Input
                  placeholder={`Atributo ${idx + 1} (ej. Color)`}
                  value={axis.key}
                  onChange={(e) => updateAxis(axis.id, "key", e.target.value)}
                />
                <Input
                  placeholder="Valores separados por coma (ej. Rojo, Azul)"
                  value={axis.valuesRaw}
                  onChange={(e) => updateAxis(axis.id, "valuesRaw", e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-red-500"
                disabled={axes.length === 1}
                onClick={() => removeAxis(axis.id)}
              >
                <Trash2 size={15} />
              </Button>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 gap-1.5"
          onClick={addAxis}
        >
          <Plus size={14} />
          Agregar atributo
        </Button>
      </div>

      {/* ── Generated variants matrix ───────────────────────────────────── */}
      {hasMatrix && (
        <>
          <Separator />
          <div>
            {/* FIX: <div> instead of <p> because Badge renders a <div> inside */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                Variantes generadas
                <Badge variant="secondary">{rows.length}</Badge>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-muted-foreground"
                onClick={regenerateSkus}
              >
                <RefreshCw size={12} />
                Regenerar SKUs
              </Button>
            </div>

            <div className="rounded-md border overflow-hidden">
              {/* Header */}
              <div
                className="grid bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground border-b"
                style={{ gridTemplateColumns: "1fr 1fr 100px 130px" }}
              >
                <span>Atributos</span>
                <span>SKU</span>
                <span>Δ Precio</span>
                <span>Código de barras</span>
              </div>

              {/* Rows */}
              <div className="divide-y">
                {rows.map((row) => (
                  <div
                    key={row._key}
                    className="grid items-center gap-2 px-3 py-2"
                    style={{ gridTemplateColumns: "1fr 1fr 100px 130px" }}
                  >
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(row.attributes).map(([k, v]) => (
                        <Badge key={k} variant="outline" className="text-xs gap-1 font-normal">
                          <span className="text-muted-foreground">{k}:</span>
                          {v}
                        </Badge>
                      ))}
                    </div>

                    <Input
                      className="h-8 text-xs font-mono"
                      value={row.sku}
                      onChange={(e) => updateRow(row._key, "sku", e.target.value)}
                    />

                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground shrink-0">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        className="h-8 text-xs"
                        value={row.priceDelta}
                        onChange={(e) =>
                          updateRow(row._key, "priceDelta", parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <Tag size={12} className="text-muted-foreground shrink-0" />
                      <Input
                        className="h-8 text-xs"
                        placeholder="Opcional"
                        value={row.barcode ?? ""}
                        onChange={(e) => updateRow(row._key, "barcode", e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              <span className="font-medium">Δ Precio</span>: ajuste sobre el precio al público del producto (puede ser negativo).
            </p>
          </div>
        </>
      )}
    </div>
  );
}

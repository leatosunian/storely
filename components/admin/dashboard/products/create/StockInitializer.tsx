"use client";

/**
 * StockInitializer
 *
 * Renders stock quantity inputs when creating a product.
 *
 * — No variants: one row per branch, one quantity column.
 * — With variants: cross-table (variant rows × branch columns) when ≤ 4 branches,
 *   otherwise stacked per-variant cards.
 *
 * Key format stored in the parent map:
 *   `default:${branchId}`          → simple product (no variants)
 *   `${variantKey}:${branchId}`    → product with variants
 */

import React from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { VariantRow } from "@/components/admin/dashboard/products/create/VariantsBuilder";

export interface Branch {
  _id: string;
  branchName: string;
  branchCode: string;
}

/** flat map: key → quantity */
export type StockInputMap = Record<string, number>;

interface StockInitializerProps {
  hasVariants: boolean;
  variantRows: VariantRow[];
  branches: Branch[];
  value: StockInputMap;
  onChange: (value: StockInputMap) => void;
}

function setKey(map: StockInputMap, key: string, raw: string): StockInputMap {
  if (raw === "") {
    const next = { ...map };
    delete next[key];
    return next;
  }
  const qty = Math.max(0, parseInt(raw, 10) || 0);
  return { ...map, [key]: qty };
}

/** Prevents number inputs from changing via scroll wheel or arrow keys. */
const numberInputGuard = {
  onWheel: (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  },
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
    }
  },
};

function AttrBadges({ attributes }: { attributes: Record<string, string> }) {
  return (
    <>
      {Object.entries(attributes).map(([k, v]) => (
        <Badge key={k} variant="outline" className="text-xs font-normal gap-1 shrink-0">
          <span className="text-muted-foreground">{k}:</span>
          {v}
        </Badge>
      ))}
    </>
  );
}

export function StockInitializer({
  hasVariants,
  variantRows,
  branches,
  value,
  onChange,
}: StockInitializerProps) {
  // ── No branches ─────────────────────────────────────────────────────────────
  if (branches.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No hay sucursales registradas aún. El stock se podrá ajustar luego desde la edición del producto.
      </p>
    );
  }

  // ── Simple product (no variants) ─────────────────────────────────────────
  if (!hasVariants || variantRows.length === 0) {
    return (
      <div className="rounded-md border overflow-hidden divide-y">
        <div
          className="grid px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground"
          style={{ gridTemplateColumns: "1fr 100px" }}
        >
          <span>Sucursal</span>
          <span className="text-center">Cantidad</span>
        </div>

        {branches.map((branch) => {
          const key = `default:${branch._id}`;
          return (
            <div
              key={branch._id}
              className="grid items-center gap-2 px-3 py-2.5"
              style={{ gridTemplateColumns: "1fr 100px" }}
            >
              <div>
                <p className="text-sm font-medium">{branch.branchName}</p>
                <p className="text-xs text-muted-foreground font-mono">{branch.branchCode}</p>
              </div>
              <Input
                type="number"
                min="0"
                className="h-8 text-sm text-center"
                value={key in value ? value[key] : ""}
                placeholder="0"
                onChange={(e) => onChange(setKey(value, key, e.target.value))}
                {...numberInputGuard}
              />
            </div>
          );
        })}
      </div>
    );
  }

  // ── Product with variants ────────────────────────────────────────────────

  // Grid layout when branches fit in columns (≤ 4)
  if (branches.length <= 4) {
    const cols = `1fr repeat(${branches.length}, 84px)`;
    return (
      <div className="rounded-md border overflow-hidden">
        {/* Header */}
        <div
          className="grid px-3 py-2 bg-muted/50 border-b text-xs font-medium text-muted-foreground"
          style={{ gridTemplateColumns: cols }}
        >
          <span>Variante</span>
          {branches.map((b) => (
            <span key={b._id} className="text-center truncate" title={b.branchName}>
              {b.branchCode}
            </span>
          ))}
        </div>

        <div className="divide-y">
          {variantRows.map((row) => (
            <div
              key={row._key}
              className="grid items-center gap-2 px-3 py-2"
              style={{ gridTemplateColumns: cols }}
            >
              <div className="flex flex-wrap gap-1">
                <AttrBadges attributes={row.attributes} />
              </div>
              {branches.map((branch) => {
                const key = `${row._key}:${branch._id}`;
                return (
                  <div key={branch._id} className="flex justify-center">
                    <Input
                      type="number"
                      min="0"
                      className="h-8 text-sm text-center w-20"
                      value={key in value ? value[key] : ""}
                      placeholder="0"
                      onChange={(e) => onChange(setKey(value, key, e.target.value))}
                      {...numberInputGuard}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Stacked layout when there are many branches
  return (
    <div className="space-y-3">
      {variantRows.map((row) => (
        <div key={row._key} className="border rounded-md p-3 space-y-2">
          <div className="flex flex-wrap gap-1 mb-1">
            <AttrBadges attributes={row.attributes} />
          </div>
          <div className="divide-y">
            {branches.map((branch) => {
              const key = `${row._key}:${branch._id}`;
              return (
                <div
                  key={branch._id}
                  className="flex items-center justify-between py-2 gap-4"
                >
                  <div>
                    <p className="text-xs font-medium">{branch.branchName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{branch.branchCode}</p>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    className="h-7 text-xs text-center w-20"
                    value={key in value ? value[key] : ""}
                    placeholder="0"
                    onChange={(e) => onChange(setKey(value, key, e.target.value))}
                    {...numberInputGuard}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

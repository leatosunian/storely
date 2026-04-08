"use client";

/**
 * VariantsManager
 *
 * Used on the edit product page.
 * - Lists existing active variants with inline edit (SKU, priceDelta, barcode)
 * - Allows soft-deleting a variant (non-default only)
 * - Allows adding a new variant via a small inline form
 */

import React, { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Pencil, Check, X, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LocaleNumberInput } from "@/components/admin/dashboard/productList/LocaleNumberInput";
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

interface Variant {
  _id: string;
  sku: string;
  attributes: Record<string, string>;
  isDefault: boolean;
  priceDelta: number;
  customPrice?: number;
  barcode?: string;
}

interface VariantsManagerProps {
  productId: string;
}

interface EditingState {
  sku: string;
  priceDelta: string;
  customPrice: string;
  barcode: string;
}

interface NewVariantState {
  sku: string;
  priceDelta: string;
  customPrice: string;
  barcode: string;
  attributeKey: string;
  attributeValue: string;
}

const DEFAULT_NEW: NewVariantState = {
  sku: "",
  priceDelta: "0",
  customPrice: "",
  barcode: "",
  attributeKey: "",
  attributeValue: "",
};

export function VariantsManager({ productId }: VariantsManagerProps) {
  const { toast } = useToast();
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingState, setEditingState] = useState<EditingState>({ sku: "", priceDelta: "0", customPrice: "", barcode: "" });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newVariant, setNewVariant] = useState<NewVariantState>(DEFAULT_NEW);
  const [addingAttributes, setAddingAttributes] = useState<{ key: string; value: string }[]>([
    { key: "", value: "" },
  ]);
  const [savingNew, setSavingNew] = useState(false);

  const fetchVariants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/variants`);
      if (!res.ok) throw new Error();
      setVariants(await res.json());
    } catch {
      toast({ description: "Error al cargar variantes.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  // ── Edit inline ────────────────────────────────────────────────────────────

  function startEdit(v: Variant) {
    setEditingId(v._id);
    setEditingState({
      sku: v.sku,
      priceDelta: v.priceDelta.toString(),
      customPrice: v.customPrice != null ? v.customPrice.toString() : "",
      barcode: v.barcode ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: string) {
    setSavingId(id);
    try {
      const res = await fetch(`/api/variants/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: editingState.sku,
          priceDelta: parseFloat(editingState.priceDelta) || 0,
          customPrice: editingState.customPrice !== "" ? parseFloat(editingState.customPrice) || 0 : undefined,
          barcode: editingState.barcode || undefined,
          attributes: variants.find((v) => v._id === id)?.attributes ?? {},
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.msg || "Error");
      }
      toast({ description: "Variante actualizada." });
      setEditingId(null);
      await fetchVariants();
    } catch (err: any) {
      toast({ description: err.message || "Error al guardar.", variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function confirmDelete() {
    if (!confirmDeleteId) return;
    setDeletingId(confirmDeleteId);
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`/api/variants/${confirmDeleteId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.msg || "Error");
      }
      toast({ description: "Variante eliminada." });
      await fetchVariants();
    } catch (err: any) {
      toast({ description: err.message || "Error al eliminar.", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  }

  // ── Add new variant ────────────────────────────────────────────────────────

  async function handleAddVariant() {
    const attributes: Record<string, string> = {};
    addingAttributes.forEach(({ key, value }) => {
      if (key.trim() && value.trim()) attributes[key.trim()] = value.trim();
    });

    if (!newVariant.sku.trim()) {
      toast({ description: "El SKU es requerido.", variant: "destructive" });
      return;
    }

    setSavingNew(true);
    try {
      const res = await fetch(`/api/products/${productId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: newVariant.sku,
          priceDelta: parseFloat(newVariant.priceDelta) || 0,
          customPrice: newVariant.customPrice !== "" ? parseFloat(newVariant.customPrice) || 0 : undefined,
          barcode: newVariant.barcode || undefined,
          attributes,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.msg || "Error");
      }
      toast({ description: "¡Variante agregada!" });
      setNewVariant(DEFAULT_NEW);
      setAddingAttributes([{ key: "", value: "" }]);
      setShowNewForm(false);
      await fetchVariants();
    } catch (err: any) {
      toast({ description: err.message || "Error al agregar variante.", variant: "destructive" });
    } finally {
      setSavingNew(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <Loader2 className="animate-spin text-muted-foreground" size={20} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Variants list */}
      {variants.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay variantes activas.</p>
      ) : (
        <div className="rounded-md border overflow-hidden divide-y">
          {/* Header */}
          <div
            className="grid px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground"
            style={{ gridTemplateColumns: "1fr 1fr 110px 90px 120px 72px" }}
          >
            <span>Atributos</span>
            <span>SKU</span>
            <span>Precio</span>
            <span>Δ Precio</span>
            <span>Cód. barras</span>
            <span />
          </div>

          {variants.map((v) => {
            const isEditing = editingId === v._id;
            const isSaving = savingId === v._id;
            const isDeleting = deletingId === v._id;

            return (
              <div
                key={v._id}
                className="grid items-center gap-2 px-3 py-2"
                style={{ gridTemplateColumns: "1fr 1fr 110px 90px 120px 72px" }}
              >
                {/* Attributes */}
                <div className="flex flex-wrap gap-1">
                  {v.isDefault ? (
                    <Badge variant="secondary" className="text-xs">Sin variante</Badge>
                  ) : Object.keys(v.attributes).length > 0 ? (
                    Object.entries(v.attributes).map(([k, val]) => (
                      <Badge key={k} variant="outline" className="text-xs gap-1 font-normal">
                        <span className="text-muted-foreground">{k}:</span>
                        {val}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground font-mono">{v.sku}</span>
                  )}
                </div>

                {/* SKU */}
                {isEditing ? (
                  <Input
                    className="h-8 text-xs font-mono"
                    value={editingState.sku}
                    onChange={(e) => setEditingState((s) => ({ ...s, sku: e.target.value }))}
                  />
                ) : (
                  <span className="text-xs font-mono text-muted-foreground truncate">{v.sku}</span>
                )}

                {/* Custom price */}
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">$</span>
                    <LocaleNumberInput
                      className="h-8 text-xs"
                      placeholder="Heredado"
                      value={editingState.customPrice}
                      onChange={(v) => setEditingState((s) => ({ ...s, customPrice: v ? v.toString() : "" }))}
                    />
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {v.customPrice != null
                      ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(v.customPrice)
                      : "Heredado"}
                  </span>
                )}

                {/* Price delta */}
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">$</span>
                    <LocaleNumberInput
                      className="h-8 text-xs"
                      placeholder="0"
                      value={editingState.priceDelta}
                      onChange={(v) => setEditingState((s) => ({ ...s, priceDelta: v.toString() }))}
                    />
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {v.priceDelta !== 0
                      ? `${v.priceDelta > 0 ? "+" : ""}${new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(v.priceDelta)}`
                      : "—"}
                  </span>
                )}

                {/* Barcode */}
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <Tag size={11} className="text-muted-foreground shrink-0" />
                    <Input
                      className="h-8 text-xs"
                      placeholder="Opcional"
                      value={editingState.barcode}
                      onChange={(e) => setEditingState((s) => ({ ...s, barcode: e.target.value }))}
                    />
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground truncate">
                    {v.barcode || "—"}
                  </span>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-1">
                  {isEditing ? (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-green-600 hover:text-green-700"
                        onClick={() => saveEdit(v._id)}
                        disabled={isSaving}
                      >
                        {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground"
                        onClick={cancelEdit}
                        disabled={isSaving}
                      >
                        <X size={13} />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => startEdit(v)}
                        disabled={isDeleting}
                      >
                        <Pencil size={13} />
                      </Button>
                      {!v.isDefault && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-red-500"
                          onClick={() => setConfirmDeleteId(v._id)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add new variant form */}
      {showNewForm ? (
        <div className="rounded-md border p-4 space-y-4 bg-muted/20">
          <p className="text-sm font-medium">Nueva variante</p>

          {/* Attributes */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Atributos (ej. Color: Rojo)</p>
            {addingAttributes.map((attr, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  className="h-8 text-sm"
                  placeholder="Atributo (ej. Color)"
                  value={attr.key}
                  onChange={(e) =>
                    setAddingAttributes((prev) =>
                      prev.map((a, i) => (i === idx ? { ...a, key: e.target.value } : a))
                    )
                  }
                />
                <Input
                  className="h-8 text-sm"
                  placeholder="Valor (ej. Rojo)"
                  value={attr.value}
                  onChange={(e) =>
                    setAddingAttributes((prev) =>
                      prev.map((a, i) => (i === idx ? { ...a, value: e.target.value } : a))
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-red-500"
                  disabled={addingAttributes.length === 1}
                  onClick={() => setAddingAttributes((prev) => prev.filter((_, i) => i !== idx))}
                >
                  <Trash2 size={13} />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground"
              onClick={() => setAddingAttributes((prev) => [...prev, { key: "", value: "" }])}
            >
              <Plus size={12} />
              Agregar atributo
            </Button>
          </div>

          {/* SKU + price + delta + barcode */}
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">SKU *</label>
              <Input
                className="h-8 text-xs font-mono"
                placeholder="SKU-001"
                value={newVariant.sku}
                onChange={(e) => setNewVariant((s) => ({ ...s, sku: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Precio ($)</label>
              <LocaleNumberInput
                className="h-8 text-xs"
                placeholder="Heredado"
                value={newVariant.customPrice}
                onChange={(v) => setNewVariant((s) => ({ ...s, customPrice: v ? v.toString() : "" }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Δ Precio ($)</label>
              <LocaleNumberInput
                className="h-8 text-xs"
                placeholder="0"
                value={newVariant.priceDelta}
                onChange={(v) => setNewVariant((s) => ({ ...s, priceDelta: v.toString() }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Cód. barras</label>
              <Input
                className="h-8 text-xs"
                placeholder="Opcional"
                value={newVariant.barcode}
                onChange={(e) => setNewVariant((s) => ({ ...s, barcode: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowNewForm(false);
                setNewVariant(DEFAULT_NEW);
                setAddingAttributes([{ key: "", value: "" }]);
              }}
              disabled={savingNew}
            >
              Cancelar
            </Button>
            <Button type="button" size="sm" onClick={handleAddVariant} disabled={savingNew}>
              {savingNew && <Loader2 size={13} className="animate-spin mr-1.5" />}
              Agregar variante
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowNewForm(true)}
        >
          <Plus size={14} />
          Agregar variante
        </Button>
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar variante</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la variante y sus registros de stock en todas las sucursales. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-900 text-white hover:bg-red-800"
              onClick={confirmDelete}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

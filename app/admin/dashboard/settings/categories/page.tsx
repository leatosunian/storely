"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Loader2, ChevronDown, ChevronRight, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ICategory } from "@/lib/db/models/category";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import Link from "next/link";

// Tree node returned by GET /api/categories?tree=true
type CategoryNode = Omit<ICategory, "_id"> & {
  _id: string;
  children: CategoryNode[];
};

type DialogMode =
  | { type: "add-root" }
  | { type: "edit"; node: CategoryNode }
  | { type: "add-child"; parent: CategoryNode }
  | null;

export default function CategoriesPage() {
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [inputValue, setInputValue] = useState("");
  const [pendingDelete, setPendingDelete] = useState<CategoryNode | null>(null);
  const { toast } = useToast();

  const fetchTree = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories?tree=true");
      const data = await res.json();
      setTree(Array.isArray(data) ? data : []);
    } catch {
      toast({ description: "Error al cargar categorías", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function openDialog(mode: DialogMode) {
    setDialogMode(mode);
    setInputValue(mode?.type === "edit" ? mode.node.name : "");
  }

  async function handleSubmit() {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setIsSubmitting(true);

    try {
      let res: Response;

      if (dialogMode?.type === "add-root") {
        res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        });
      } else if (dialogMode?.type === "add-child") {
        res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed, parentId: dialogMode.parent._id }),
        });
      } else if (dialogMode?.type === "edit") {
        res = await fetch(`/api/categories/${dialogMode.node._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        });
      } else {
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }

      const messages: Record<string, string> = {
        "add-root": "¡Categoría creada!",
        "add-child": "¡Subcategoría creada!",
        "edit": "¡Nombre actualizado!",
      };
      toast({ description: messages[dialogMode.type] });
      setDialogMode(null);
      fetchTree();
    } catch (err: any) {
      toast({ description: err.message || "Error al guardar", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/categories/${pendingDelete._id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }
      toast({ description: "¡Eliminado!" });
      setPendingDelete(null);
      fetchTree();
    } catch (err: any) {
      toast({ description: err.message || "Error al eliminar", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const dialogTitle =
    dialogMode?.type === "add-root"
      ? "Nueva categoría"
      : dialogMode?.type === "edit"
        ? "Editar nombre"
        : dialogMode?.type === "add-child"
          ? `Nueva subcategoría en "${dialogMode.parent.name}"`
          : "";

  function renderNode(node: CategoryNode, depth = 0) {
    const isExpanded = expandedIds.has(node._id);
    const hasChildren = node.children.length > 0;
    const indent = depth * 24;

    return (
      <div key={node._id}>
        <div
          className="flex items-center justify-between px-4 py-3 bg-background hover:bg-muted/30 transition-colors"
          style={{ paddingLeft: `${16 + indent}px` }}
        >
          <button
            className="flex items-center gap-2 flex-1 text-left"
            onClick={() => toggleExpand(node._id)}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown size={16} className="text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight size={16} className="text-muted-foreground shrink-0" />
              )
            ) : (
              <span className="w-4 shrink-0" />
            )}
            <span className={`text-sm ${depth > 0 ? "text-muted-foreground" : "font-medium"}`}>
              {node.name}
            </span>
            {hasChildren && (
              <span className="text-xs text-muted-foreground ml-1">
                ({node.children.length})
              </span>
            )}
          </button>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Agregar subcategoría"
              onClick={() => openDialog({ type: "add-child", parent: node })}
            >
              <Plus size={13} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Editar"
              onClick={() => openDialog({ type: "edit", node })}
            >
              <Pencil size={13} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              title="Eliminar"
              onClick={() => setPendingDelete(node)}
            >
              <Trash2 size={13} />
            </Button>
          </div>
        </div>

        {isExpanded && node.children.length > 0 && (
          <div className="border-t dark:border-border">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
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
              <BreadcrumbPage className="text-xs">
                Categorías
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-2xl font-semibold">Categorías</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Administrá las categorías y subcategorías de tus productos.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="animate-spin text-muted-foreground" />
        </div>
      ) : tree.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-5">
          <p className="text-sm">Todavía no creaste categorías.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openDialog({ type: "add-root" })}
          >
            <Plus size={15} className="mr-1" />
            Crear categoría
          </Button>
        </div>
      ) : (
        <>
          <div className="border rounded-lg divide-y dark:divide-border overflow-hidden">
            {tree.map((node) => renderNode(node))}
          </div>
          <Button className="mt-5" onClick={() => openDialog({ type: "add-root" })} size="sm">
            <Plus size={16} className="mr-1" />
            Nueva categoría
          </Button>
        </>

      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogMode !== null} onOpenChange={(open) => !open && setDialogMode(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>
              {dialogMode?.type === "add-root" || dialogMode?.type === "edit"
                ? "El nombre debe ser único dentro del mismo nivel."
                : "Ingresá el nombre de la subcategoría."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              autoFocus
              placeholder="Nombre"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMode(null)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !inputValue.trim()}>
              {isSubmitting && <Loader2 size={14} className="animate-spin mr-1" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => { if (!open) setPendingDelete(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Eliminar &ldquo;{pendingDelete?.name}&rdquo;
            </AlertDialogTitle>
            <AlertDialogDescription>
              {(pendingDelete?.children?.length ?? 0) > 0
                ? "Se eliminarán también todas sus subcategorías. Esta acción no se puede deshacer."
                : "Esta acción no se puede deshacer."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-900 text-white hover:bg-red-800"
              onClick={handleDelete}
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin mr-1" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

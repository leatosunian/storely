"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { IProduct } from "@/interfaces/IProduct";
import { ICategory } from "@/lib/db/models/category";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  categoryId: z.string().min(1, "La categoría es requerida"),
  listPrice: z.string().min(1, "El precio de lista es requerido"),
  profitPercent: z.string().min(1, "El porcentaje de ganancia es requerido"),
  marca: z.string().optional(),
  modelo: z.string().optional(),
});

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: Partial<IProduct>, isEditing: boolean) => Promise<void>;
  editingProduct: IProduct | null;
}

export function ProductDialog({
  open,
  onOpenChange,
  onSubmit,
  editingProduct,
}: ProductDialogProps) {

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<(ICategory & { children: any[] })[]>([]);

  useEffect(() => {
    fetch("/api/categories?tree=true")
      .then((r) => r.json())
      .then((tree) => setCategories(tree))
      .catch(() => {});
  }, []);

  // Flatten the category tree into a list for the select
  function flattenCategories(nodes: any[], depth = 0): { _id: string; name: string; path: string; depth: number }[] {
    const result: { _id: string; name: string; path: string; depth: number }[] = [];
    for (const node of nodes) {
      result.push({ _id: node._id.toString(), name: node.name, path: node.path, depth });
      if (node.children?.length) {
        result.push(...flattenCategories(node.children, depth + 1));
      }
    }
    return result;
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      categoryId: "",
      listPrice: "",
      profitPercent: "",
      marca: "",
      modelo: "",
    },
  });

  useEffect(() => {
    if (editingProduct) {
      form.reset({
        nombre: editingProduct.nombre,
        categoryId: editingProduct.categoryId?.toString() ?? "",
        listPrice: editingProduct.listPrice.toString(),
        profitPercent: editingProduct.profitPercent?.toString() ?? "",
        marca: editingProduct.marca || "",
        modelo: editingProduct.modelo || "",
      });
    } else {
      form.reset({
        nombre: "",
        categoryId: "",
        listPrice: "",
        profitPercent: "",
        marca: "",
        modelo: "",
      });
    }
  }, [editingProduct, form]);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const selectedCategory = flattenCategories(categories).find((c) => c._id === values.categoryId);
    await onSubmit(
      {
        nombre: values.nombre,
        categoryId: values.categoryId as any,
        categoryPath: selectedCategory?.path ?? "",
        listPrice: parseFloat(values.listPrice),
        profitPercent: values.profitPercent ? parseFloat(values.profitPercent) : undefined,
        marca: values.marca,
        modelo: values.modelo,
        _id: editingProduct?._id,
      },
      !!editingProduct,
    );
    setIsSubmitting(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogHeader className="mb-2">
              <DialogTitle className="text-left">
                {editingProduct ? "Editar producto" : "Crear producto"}
              </DialogTitle>
              <DialogDescription className="text-left">
                {editingProduct
                  ? "Modifica los datos del producto."
                  : "Ingresá los datos de tu nuevo producto."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 ">
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
                        {flattenCategories(categories).map((cat) => (
                          <SelectItem key={cat._id} value={cat._id}>
                            {"\u00a0".repeat(cat.depth * 3)}{cat.depth > 0 ? "└ " : ""}{cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="marca"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca <span className="text-muted-foreground">(opcional)</span></FormLabel>
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
                    <FormLabel>Modelo <span className="text-muted-foreground">(opcional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. XR-500" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="listPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio de lista</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <span className="mr-2 text-sm font-semibold w-14">
                          ARS $
                        </span>
                        <Input
                          type="number"
                          className="w-full"
                          placeholder="Ingresa el precio de lista"
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
                    <FormLabel>Porcentaje de ganancia</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <span className="mr-2 text-sm font-semibold w-fit">
                          %
                        </span>
                        <Input
                          type="number"
                          className="w-full"
                          placeholder="Ingresa el porcentaje de ganancia"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="mt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" size={16} />}
                {editingProduct ? "Guardar cambios" : "Crear producto"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


"use client";

import { useEffect, useState } from "react";
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
import { Loader2 } from "lucide-react";
import { IProduct } from "@/interfaces/IProduct";
import { LocaleNumberInput } from "@/components/admin/dashboard/productList/LocaleNumberInput";

const formSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  categoryId: z.string().min(1, "La categoría es requerida"),
  listPrice: z.string().min(1, "El precio de lista es requerido"),
  profitPercent: z.string().min(1, "El porcentaje de ganancia es requerido"),
  marca: z.string().optional(),
  modelo: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export interface ProductSubmitValues {
  nombre: string;
  categoryId: string;
  categoryPath: string;
  listPrice: number;
  profitPercent: number;
  marca?: string;
  modelo?: string;
  _id?: string;
}

interface CategoryFlat {
  _id: string;
  name: string;
  path: string;
  depth: number;
}

interface ProductFormProps {
  defaultValues?: Partial<IProduct>;
  onSubmit: (values: ProductSubmitValues) => Promise<void>;
  isSubmitting: boolean;
  submitLabel: string;
  onCancel: () => void;
}

function flattenCategories(nodes: any[], depth = 0): CategoryFlat[] {
  const result: CategoryFlat[] = [];
  for (const node of nodes) {
    result.push({ _id: node._id.toString(), name: node.name, path: node.path, depth });
    if (node.children?.length) {
      result.push(...flattenCategories(node.children, depth + 1));
    }
  }
  return result;
}

export function ProductForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel,
  onCancel,
}: ProductFormProps) {
  const [categories, setCategories] = useState<any[]>([]);

  const form = useForm<FormValues>({
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

  // Reset form when defaultValues (product data) loads
  useEffect(() => {
    if (defaultValues) {
      form.reset({
        nombre: defaultValues.nombre ?? "",
        categoryId: defaultValues.categoryId?.toString() ?? "",
        listPrice: defaultValues.listPrice?.toString() ?? "",
        profitPercent: defaultValues.profitPercent?.toString() ?? "",
        marca: defaultValues.marca ?? "",
        modelo: defaultValues.modelo ?? "",
      });
    }
  }, [defaultValues?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch("/api/categories?tree=true")
      .then((r) => r.json())
      .then((tree) => setCategories(Array.isArray(tree) ? tree : []))
      .catch(() => {});
  }, []);

  const flatCats = flattenCategories(categories);

  const handleSubmit = async (values: FormValues) => {
    const selectedCategory = flatCats.find((c) => c._id === values.categoryId);
    await onSubmit({
      nombre: values.nombre,
      categoryId: values.categoryId,
      categoryPath: selectedCategory?.path ?? "",
      listPrice: parseFloat(values.listPrice),
      profitPercent: parseFloat(values.profitPercent),
      marca: values.marca || undefined,
      modelo: values.modelo || undefined,
      _id: defaultValues?._id,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nombre */}
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Nombre del producto</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. BIOBIZZ CALMAG (500 ML)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Categoría */}
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
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

          {/* Marca */}
          <FormField
            control={form.control}
            name="marca"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Marca{" "}
                  <span className="text-muted-foreground text-xs">(opcional)</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Ej. Samsung" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Modelo */}
          <FormField
            control={form.control}
            name="modelo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Modelo{" "}
                  <span className="text-muted-foreground text-xs">(opcional)</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Ej. XR-500" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Precio de lista */}
          <FormField
            control={form.control}
            name="listPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio de lista</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-muted-foreground w-12 shrink-0">
                      ARS $
                    </span>
                    <LocaleNumberInput
                      placeholder="0,00"
                      value={field.value}
                      onChange={(v) => field.onChange(String(v))}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Porcentaje de ganancia */}
          <FormField
            control={form.control}
            name="profitPercent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Porcentaje de ganancia</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-muted-foreground w-6 shrink-0">
                      %
                    </span>
                    <LocaleNumberInput
                      placeholder="30"
                      value={field.value}
                      onChange={(v) => field.onChange(String(v))}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center gap-3 justify-end pt-2 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin mr-2" size={16} />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}

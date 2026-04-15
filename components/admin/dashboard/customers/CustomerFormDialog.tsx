"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CreateCustomerSchema, type CreateCustomerDTO } from "@/app/schemas/customerForm";
import { TAX_TYPE_LABELS, type ICustomer } from "@/interfaces/ICustomer";
import { X } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
  /** Si se pasa, el dialog funciona en modo edición */
  customer?: ICustomer & { _id: string };
}

type FormValues = CreateCustomerDTO;

const PROVINCES = [
  "Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut",
  "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy",
  "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén",
  "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz",
  "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán",
];

// ── Component ──────────────────────────────────────────────────────────────

export function CustomerFormDialog({ open, onOpenChange, onSuccess, customer }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const isEdit = Boolean(customer);

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateCustomerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      taxId: "",
      taxType: "consumidor_final",
      tags: [],
      notes: "",
      status: "active",
      creditLimit: 0,
      address: {
        street: "", city: "", province: "Buenos Aires", postalCode: "", country: "Argentina",
      },
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (customer) {
      form.reset({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone ?? "",
        taxId: customer.taxId ?? "",
        taxType: customer.taxType ?? "consumidor_final",
        tags: customer.tags ?? [],
        notes: customer.notes ?? "",
        status: customer.status,
        creditLimit: customer.creditLimit ?? 0,
        address: customer.address ?? {
          street: "", city: "", province: "Buenos Aires", postalCode: "", country: "Argentina",
        },
      });
    } else {
      form.reset();
    }
  }, [customer, open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tags helpers ─────────────────────────────────────────────────────────

  const tags = form.watch("tags") ?? [];

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (!trimmed || tags.includes(trimmed)) { setTagInput(""); return; }
    form.setValue("tags", [...tags, trimmed]);
    setTagInput("");
  };

  const removeTag = (tag: string) =>
    form.setValue("tags", tags.filter((t) => t !== tag));

  // ── Submit ────────────────────────────────────────────────────────────────

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const url = isEdit ? `/api/customers/${customer!._id}` : "/api/customers";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message ?? "Error al guardar");
      toast({ title: isEdit ? "Cliente actualizado" : "Cliente creado" });
      onSuccess();
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto"
      >
        <SheetHeader className="mb-4">
          <SheetTitle>{isEdit ? "Editar cliente" : "Nuevo cliente"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Modificá los datos del cliente."
              : "Completá los datos para registrar un nuevo cliente."}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-6">

            {/* ── Datos personales ──────────────────────────────────── */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Datos personales
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl><Input {...field} placeholder="Juan" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido *</FormLabel>
                    <FormControl><Input {...field} placeholder="Pérez" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl><Input {...field} type="email" placeholder="juan@ejemplo.com" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono *</FormLabel>
                  <FormControl><Input {...field}  placeholder="+54 9 11 1234-5678" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </section>

            <Separator />

            {/* ── Datos fiscales AFIP ───────────────────────────────── */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Condición fiscal (AFIP)
              </h3>

              <FormField control={form.control} name="taxId" render={({ field }) => (
                <FormItem>
                  <FormLabel>CUIT / CUIL *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="20 12345678 9"
                      type="number"
                      maxLength={11}
                      className="font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="taxType" render={({ field }) => (
                <FormItem>
                  <FormLabel>Condición frente al IVA *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(TAX_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </section>

            <Separator />

            {/* ── Dirección ─────────────────────────────────────────── */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Dirección
              </h3>

              <FormField control={form.control} name="address.street" render={({ field }) => (
                <FormItem>
                  <FormLabel>Calle y número *</FormLabel>
                  <FormControl><Input {...field} placeholder="Av. Corrientes 1234" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="address.city" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad *</FormLabel>
                    <FormControl><Input {...field} placeholder="Mar del Plata" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="address.province" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provincia</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Provincia" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROVINCES.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="address.postalCode" render={({ field }) => (
                <FormItem>
                  <FormLabel>Código postal</FormLabel>
                  <FormControl><Input {...field} placeholder="7600" className="w-32" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </section>

            <Separator />

            {/* ── Cuenta corriente ──────────────────────────────────── */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Cuenta corriente
              </h3>

              <FormField control={form.control} name="creditLimit" render={({ field }) => (
                <FormItem>
                  <FormLabel>Límite de crédito (ARS)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={0}
                      step={100}
                      placeholder="0"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    0 = sin crédito habilitado.
                  </p>
                  <FormMessage />
                </FormItem>
              )} />
            </section>

            <Separator />

            {/* ── Etiquetas ─────────────────────────────────────────── */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Etiquetas
              </h3>

              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Ej: mayorista, vip..."
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Agregar
                </Button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </section>

            <Separator />

            {/* ── Notas y estado ────────────────────────────────────── */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Notas y estado
              </h3>

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas internas</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Información adicional sobre el cliente..."
                      rows={3}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="inactive">Inactivo</SelectItem>
                      <SelectItem value="blocked">Bloqueado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </section>

            {/* ── Footer ───────────────────────────────────────────── */}
            <SheetFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear cliente"}
              </Button>
            </SheetFooter>

          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

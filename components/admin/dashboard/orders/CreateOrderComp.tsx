"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { CreateOrderSchema, type CreateOrderDTO } from "@/app/schemas/orderForm";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CustomerOption {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface BranchOption {
  _id: string;
  branchName: string;
}

interface ProductOption {
  _id: string;
  nombre: string;
  publicPrice: number;
  hasVariants: boolean;
}

export function CreateOrderComp() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);

  const form = useForm<CreateOrderDTO>({
    resolver: zodResolver(CreateOrderSchema),
    defaultValues: {
      customerId: "",
      branchId: "",
      employeeId: "",
      items: [{ productId: "", variantId: "", sku: "", name: "", unitPrice: 0, quantity: 1, discount: 0 }],
      paymentMethod: undefined,
      shippingCost: 0,
      tax: 0,
      notes: "",
      shippingAddress: undefined,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const [showShipping, setShowShipping] = useState(false);

  const numberFieldProps = {
    onWheel: (e: React.WheelEvent<HTMLInputElement>) => e.currentTarget.blur(),
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
    },
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/customers?limit=100").then((r) => r.json()),
      fetch("/api/branches").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ]).then(([custRes, branchRes, prodRes]) => {
      setCustomers(custRes.data ?? []);
      setBranches(Array.isArray(branchRes) ? branchRes : []);
      setProducts(Array.isArray(prodRes) ? prodRes : []);
    });
  }, []);

  const watchItems = form.watch("items");
  const watchTax = form.watch("tax");
  const watchShippingCost = form.watch("shippingCost");

  const itemsSubtotal = watchItems.reduce((acc, item) => {
    const sub = (item.unitPrice || 0) * (item.quantity || 0) * (1 - (item.discount || 0) / 100);
    return acc + sub;
  }, 0);

  const total = itemsSubtotal + (watchTax || 0) + (watchShippingCost || 0);

  function handleProductSelect(index: number, productId: string) {
    const product = products.find((p) => p._id === productId);
    if (product) {
      form.setValue(`items.${index}.productId`, productId);
      form.setValue(`items.${index}.name`, product.nombre);
      form.setValue(`items.${index}.unitPrice`, product.publicPrice);
      form.setValue(`items.${index}.sku`, product.nombre.slice(0, 20).toUpperCase().replace(/\s+/g, "-"));
    }
  }

  async function onSubmit(data: CreateOrderDTO) {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        shippingAddress: showShipping ? data.shippingAddress : undefined,
      };
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: "Pedido creado", description: `Orden ${json.data.orderNumber} creada correctamente.` });
        router.push("/admin/dashboard/orders");
      } else {
        toast({ title: "Error", description: json.message ?? "No se pudo crear el pedido.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Error de conexión.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Cliente y Sucursal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Datos generales</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.firstName} {c.lastName} — {c.email}
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
              name="branchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sucursal</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar sucursal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b._id} value={b._id}>
                          {b.branchName}
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
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de pago <span className="text-muted-foreground">(opcional)</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar método" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                      <SelectItem value="card">Tarjeta</SelectItem>
                      <SelectItem value="mercadopago">MercadoPago</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Items del pedido</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ productId: "", variantId: "", sku: "", name: "", unitPrice: 0, quantity: 1, discount: 0 })}
            >
              <Plus className="h-4 w-4 mr-1" /> Agregar ítem
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-md p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Ítem {index + 1}</span>
                  {fields.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Producto */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.productId`}
                    render={({ field: f }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Producto</FormLabel>
                        <Select onValueChange={(v) => handleProductSelect(index, v)} value={f.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar producto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products.map((p) => (
                              <SelectItem key={p._id} value={p._id}>
                                {p.nombre} — ${p.publicPrice.toLocaleString("es-AR")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* SKU */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.sku`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input placeholder="SKU" {...f} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Nombre (auto-filled) */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.name`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del producto" {...f} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Precio unitario */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.unitPrice`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>Precio unitario</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="0.00"
                            {...f}
                            value={f.value || ""}
                            onChange={(e) => f.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
                            {...numberFieldProps}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Cantidad */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>Cantidad</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            step={1}
                            placeholder="1"
                            {...f}
                            value={f.value || ""}
                            onChange={(e) => f.onChange(e.target.value === "" ? 1 : parseInt(e.target.value))}
                            {...numberFieldProps}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Descuento */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.discount`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>Descuento (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            step="0.01"
                            placeholder="0"
                            {...f}
                            value={f.value || ""}
                            onChange={(e) => f.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
                            {...numberFieldProps}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Subtotal del item */}
                  <div className="flex flex-col justify-end">
                    <span className="text-xs text-muted-foreground mb-1">Subtotal</span>
                    <span className="text-sm font-medium">
                      ${(
                        (watchItems[index]?.unitPrice || 0) *
                        (watchItems[index]?.quantity || 0) *
                        (1 - (watchItems[index]?.discount || 0) / 100)
                      ).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Costos adicionales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Costos adicionales</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="tax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Impuestos</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
                      {...numberFieldProps}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shippingCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Costo de envío</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
                      {...numberFieldProps}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col justify-end">
              <span className="text-xs text-muted-foreground mb-1">Total estimado</span>
              <span className="text-xl font-bold">
                ${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Dirección de envío (toggle) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Dirección de envío</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowShipping(!showShipping)}>
              {showShipping ? "Quitar dirección" : "Agregar dirección"}
            </Button>
          </CardHeader>
          {showShipping && (
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="shippingAddress.street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calle</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Av. Corrientes 1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shippingAddress.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Buenos Aires" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shippingAddress.province"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provincia</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. CABA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shippingAddress.postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código postal <span className="text-muted-foreground">(opcional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. C1043" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          )}
        </Card>

        {/* Notas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas del pedido <span className="text-muted-foreground">(opcional)</span></FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Instrucciones especiales, comentarios..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
            Crear pedido
          </Button>
        </div>
      </form>
    </Form>
  );
}

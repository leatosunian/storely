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
import { Loader2, Plus, Trash2, ChevronDown, X, MapPin, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ProductPickerModal, {
  type ProductOption,
  type ProductSelection,
} from "../ProductPickerModal";
import CustomerPickerModal, { type CustomerOption } from "../CustomerPickerModal";
import { LocaleNumberInput } from "../../products/LocaleNumberInput";

interface BranchOption {
  _id: string;
  branchName: string;
}

export default function CreateOrderForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
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
      installments: undefined,
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

  const [shippingMode, setShippingMode] = useState<"none" | "delivery" | "pickup">("none");
  const [pickupBranchId, setPickupBranchId] = useState<string>("");
  const [productPickerIndex, setProductPickerIndex] = useState<number | null>(null);
  // field.id → quantityAvailable at the selected branch (undefined = no constraint)
  const [itemStocks, setItemStocks] = useState<Record<string, number>>({});

  const numberFieldProps = {
    onWheel: (e: React.WheelEvent<HTMLInputElement>) => e.currentTarget.blur(),
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
    },
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/branches").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ]).then(([branchRes, prodRes]) => {
      console.log('branchRes', branchRes);
      setBranches(Array.isArray(branchRes.branches) ? branchRes.branches : []);
      setProducts(Array.isArray(prodRes) ? prodRes : []);
    });
  }, []);

  const watchPaymentMethod = form.watch("paymentMethod");
  const watchItems = form.watch("items");
  const watchTax = form.watch("tax");
  const watchShippingCost = form.watch("shippingCost");

  const itemsSubtotal = watchItems.reduce((acc, item) => {
    const sub = (item.unitPrice || 0) * (item.quantity || 0) * (1 - (item.discount || 0) / 100);
    return acc + sub;
  }, 0);

  const total = itemsSubtotal + (watchTax || 0) + (watchShippingCost || 0);

  function handleProductSelect(index: number, { product, variant, availableStock }: ProductSelection) {
    form.setValue(`items.${index}.productId`, product._id);
    form.setValue(`items.${index}.variantId`, variant?._id ?? "");

    if (variant) {
      const attrLabel = Object.values(variant.attributes).join(" / ");
      form.setValue(
        `items.${index}.name`,
        attrLabel ? `${product.nombre} — ${attrLabel}` : product.nombre
      );
      form.setValue(`items.${index}.sku`, variant.sku);
      const price = variant.customPrice ?? product.publicPrice + variant.priceDelta;
      form.setValue(`items.${index}.unitPrice`, price);
    } else {
      form.setValue(`items.${index}.name`, product.nombre);
      form.setValue(`items.${index}.unitPrice`, product.publicPrice);
      const sku =
        product.internalCode ||
        product.nombre.slice(0, 20).toUpperCase().replace(/\s+/g, "-");
      form.setValue(`items.${index}.sku`, sku);
    }

    // Reset quantity to 1 and store the stock constraint for this item slot
    form.setValue(`items.${index}.quantity`, 1);
    const fieldId = fields[index].id;
    setItemStocks((prev) => {
      if (availableStock !== undefined) return { ...prev, [fieldId]: availableStock };
      const { [fieldId]: _, ...rest } = prev;
      return rest;
    });
  }

  async function onSubmit(data: CreateOrderDTO) {
    if (shippingMode === "pickup" && !pickupBranchId) {
      toast({ title: "Error", description: "Seleccione una sucursal para el retiro.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        shippingType: shippingMode !== "none" ? shippingMode : undefined,
        shippingAddress: shippingMode === "delivery" ? data.shippingAddress : undefined,
        pickupBranchId: shippingMode === "pickup" ? pickupBranchId : undefined,
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
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 justify-between font-normal text-left h-10 px-3"
                        onClick={() => setCustomerPickerOpen(true)}
                      >
                        {selectedCustomer ? (
                          <span className="truncate text-sm">
                            {selectedCustomer.firstName} {selectedCustomer.lastName}
                            <span className="text-muted-foreground ml-1.5">
                              — {selectedCustomer.email}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Seleccionar cliente...</span>
                        )}
                        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                      </Button>
                      {f.value && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 flex-shrink-0"
                          onClick={() => {
                            setSelectedCustomer(null);
                            form.setValue("customerId", "");
                          }}
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </FormControl>
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
                  <Select
                    onValueChange={(v) => {
                      field.onChange(v);
                      if (v !== "credit_card") form.setValue("installments", undefined);
                    }}
                    value={field.value ?? ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar método" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="transfer">Transferencia bancaria</SelectItem>
                      <SelectItem value="debit_card">Tarjeta de débito</SelectItem>
                      <SelectItem value="credit_card">Tarjeta de crédito</SelectItem>
                      <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                      <SelectItem value="modo">Modo</SelectItem>
                      <SelectItem value="uala">Ualá</SelectItem>
                      <SelectItem value="naranja_x">Naranja X</SelectItem>
                      <SelectItem value="personal_pay">Personal Pay</SelectItem>
                      <SelectItem value="cuenta_dni">Cuenta DNI</SelectItem>
                      <SelectItem value="qr">Pago con QR</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchPaymentMethod === "credit_card" && (
              <>
                <FormField
                  control={form.control}
                  name="installments.quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cuotas</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={60}
                          placeholder="Ej. 12"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="installments.withInterest"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interés</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(v === "true")}
                        value={field.value === undefined ? "" : String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="false">Sin interés</SelectItem>
                          <SelectItem value="true">Con interés</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
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
                        <FormControl>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="flex-1 justify-between font-normal text-left h-10 px-3"
                              onClick={() => {
                                if (!form.getValues("branchId")) {
                                  toast({
                                    title: "",
                                    description: "Selecciona una sucursal para agregar un producto al pedido.",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                setProductPickerIndex(index);
                              }}
                            >
                              {watchItems[index]?.name ? (
                                <span className="truncate text-sm min-w-0">{watchItems[index].name}</span>
                              ) : (
                                <span className="text-muted-foreground text-sm">Seleccionar producto...</span>
                              )}
                              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                            </Button>
                            {f.value && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 flex-shrink-0"
                                onClick={() => {
                                  form.setValue(`items.${index}.productId`, "");
                                  form.setValue(`items.${index}.name`, "");
                                  form.setValue(`items.${index}.unitPrice`, 0);
                                  form.setValue(`items.${index}.sku`, "");
                                  const fieldId = fields[index].id;
                                  setItemStocks((prev) => {
                                    const { [fieldId]: _, ...rest } = prev;
                                    return rest;
                                  });
                                }}
                              >
                                <X className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            )}
                          </div>
                        </FormControl>
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
                          <LocaleNumberInput
                            min={0}
                            placeholder="0,00"
                            {...f}
                            value={f.value || ""}
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
                    render={({ field: f }) => {
                      const availableQty = itemStocks[field.id];
                      const exceedsStock =
                        availableQty !== undefined && (f.value as number) > availableQty;
                      return (
                        <FormItem>
                          <FormLabel>Cantidad</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={availableQty}
                              placeholder="1"
                              {...f}
                              value={f.value === 0 ? "" : f.value}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "") { f.onChange(""); return; }
                                const parsed = parseInt(val);
                                if (availableQty !== undefined && parsed > availableQty) {
                                  f.onChange(availableQty);
                                } else {
                                  f.onChange(parsed);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "-" || e.key === "ArrowUp" || e.key === "ArrowDown")
                                  e.preventDefault();
                              }}
                              className={exceedsStock ? "border-destructive" : ""}
                            />
                          </FormControl>
                          {availableQty !== undefined && (
                            <p className="text-xs text-muted-foreground">
                              Disponible: {availableQty}
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      );
                    }}
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
                    <LocaleNumberInput
                      min={0}
                      placeholder="0,00"
                      {...field}
                      value={field.value || ""}
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
                    <LocaleNumberInput
                      min={0}
                      placeholder="0,00"
                      {...field}
                      value={field.value || ""}
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

        {/* Dirección de envío */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg">Dirección de envío</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant={shippingMode === "delivery" ? "default" : "outline"}
                size="sm"
                onClick={() => setShippingMode(shippingMode === "delivery" ? "none" : "delivery")}
              >
                <MapPin className="h-4 w-4 mr-1.5" />
                Agregar dirección
              </Button>
              <Button
                type="button"
                variant={shippingMode === "pickup" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setShippingMode(shippingMode === "pickup" ? "none" : "pickup");
                  if (shippingMode !== "pickup") setPickupBranchId("");
                }}
              >
                <Building2 className="h-4 w-4 mr-1.5" />
                Retiro por sucursal
              </Button>
            </div>
          </CardHeader>

          {shippingMode === "delivery" && (
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="shippingAddress.street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calle</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Av. Corrientes 1234" {...field} value={field.value ?? ""} />
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
                      <Input placeholder="Ej. Buenos Aires" {...field} value={field.value ?? ""} />
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
                      <Input placeholder="Ej. CABA" {...field} value={field.value ?? ""} />
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
                      <Input placeholder="Ej. C1043" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          )}

          {shippingMode === "pickup" && (
            <CardContent>
              <div className="max-w-xs space-y-2">
                <label className="text-sm font-medium leading-none">Sucursal de retiro</label>
                <Select value={pickupBranchId} onValueChange={setPickupBranchId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sucursal" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b._id} value={b._id}>
                        {b.branchName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

      <CustomerPickerModal
        open={customerPickerOpen}
        onOpenChange={setCustomerPickerOpen}
        selectedCustomerId={selectedCustomer?._id}
        onSelect={(customer) => {
          setSelectedCustomer(customer);
          form.setValue("customerId", customer._id);
          if (customer.address && shippingMode !== "pickup") {
            setShippingMode("delivery");
            form.setValue("shippingAddress.street", customer.address.street ?? "");
            form.setValue("shippingAddress.city", customer.address.city ?? "");
            form.setValue("shippingAddress.province", customer.address.province ?? "");
            form.setValue("shippingAddress.postalCode", customer.address.postalCode ?? "");
          }
        }}
      />

      <ProductPickerModal
        open={productPickerIndex !== null}
        onOpenChange={(open) => { if (!open) setProductPickerIndex(null); }}
        products={products}
        branchId={form.watch("branchId") || undefined}
        onSelect={(selection) => {
          if (productPickerIndex !== null) {
            handleProductSelect(productPickerIndex, selection);
          }
        }}
        selectedProductId={
          productPickerIndex !== null
            ? watchItems[productPickerIndex]?.productId
            : undefined
        }
        selectedVariantId={
          productPickerIndex !== null
            ? watchItems[productPickerIndex]?.variantId
            : undefined
        }
      />
    </Form>
  );
}

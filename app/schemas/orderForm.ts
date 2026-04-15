import { z } from "zod";

const InstallmentsSchema = z.object({
  quantity:     z.number().int().min(1).max(60),
  withInterest: z.boolean(),
});

const PAYMENT_METHODS = ["cash", "transfer", "debit_card", "credit_card", "mercadopago", "modo", "uala", "naranja_x", "personal_pay", "cuenta_dni", "qr", "cheque", "other"] as const;

const OrderItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  sku: z.string().min(1),
  name: z.string().min(1),
  unitPrice: z.number().min(0),
  quantity: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? NaN : Number(v)),
    z.number({ invalid_type_error: "Ingrese una cantidad válida" }).int().min(1, "La cantidad debe ser al menos 1")
  ),
  discount: z.number().min(0).max(100).default(0),
});

const CreateOrderBaseSchema = z.object({
  customerId: z.string().min(1),
  branchId: z.string().min(1),
  employeeId: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  items: z.array(OrderItemSchema).min(1, "La orden debe tener al menos 1 ítem"),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  installments: InstallmentsSchema.optional(),
  shippingCost: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  notes: z.string().max(2000).optional(),
  shippingType: z.enum(["delivery", "pickup"]).optional(),
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    province: z.string(),
    postalCode: z.string().optional(),
    country: z.string().default("Argentina"),
  }).optional(),
  pickupBranchId: z.string().optional(),
});

export const CreateOrderSchema = CreateOrderBaseSchema.superRefine((data, ctx) => {
  if (data.shippingType === "pickup" && !data.pickupBranchId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["pickupBranchId"],
      message: "Seleccione una sucursal para el retiro",
    });
  }
});

export const UpdateOrderSchema = CreateOrderBaseSchema.partial().omit({ items: true });

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"]),
  note: z.string().optional(),
  changedBy: z.string().optional(),
});

export const OrderQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  customerId: z.string().optional(),
  branchId: z.string().optional(),
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"]).optional(),
  paymentStatus: z.enum(["pending", "paid", "partial", "refunded", "failed"]).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  sortBy: z.enum(["createdAt", "total", "status"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateOrderDTO = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderDTO = z.infer<typeof UpdateOrderSchema>;
export type UpdateStatusDTO = z.infer<typeof UpdateOrderStatusSchema>;
export type OrderQuery = z.infer<typeof OrderQuerySchema>;
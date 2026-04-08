import { z } from "zod";

const OrderItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  sku: z.string().min(1),
  name: z.string().min(1),
  unitPrice: z.number().min(0),
  quantity: z.number().int().min(1),
  discount: z.number().min(0).max(100).default(0),
});

export const CreateOrderSchema = z.object({
  customerId: z.string().min(1),
  branchId: z.string().min(1),
  employeeId: z.string().optional(),
  items: z.array(OrderItemSchema).min(1, "La orden debe tener al menos 1 ítem"),
  paymentMethod: z.enum(["cash", "transfer", "card", "mercadopago", "other"]).optional(),
  shippingCost: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  notes: z.string().max(2000).optional(),
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    province: z.string(),
    postalCode: z.string().optional(),
    country: z.string().default("Argentina"),
  }).optional(),
});

export const UpdateOrderSchema = CreateOrderSchema.partial().omit({ items: true });

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
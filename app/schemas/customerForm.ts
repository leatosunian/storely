import { z } from "zod";

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Valida CUIT/CUIL argentino.
 * Acepta con o sin guiones: "20-12345678-9" o "20123456789"
 * Normaliza a 11 dígitos sin guiones antes de guardar.
 */
const cuitRegex = /^(\d{2})-?(\d{8})-?(\d{1})$/;

const CuitSchema = z
  .string()
  .regex(cuitRegex, "CUIT inválido. Formato esperado: XX-XXXXXXXX-X")
  .transform((val) => val.replace(/-/g, ""))   // almacenar sin guiones
  .optional();

const AddressSchema = z.object({
  street: z.string().min(1, "Calle requerida"),
  city: z.string().min(1, "Ciudad requerida"),
  province: z.string().min(1, "Provincia requerida"),
  postalCode: z.string().optional(),
  country: z.string().default("Argentina"),
});

// Schemas 

export const CreateCustomerSchema = z.object({
  // Datos personales
  firstName: z.string().min(1, "Nombre requerido").max(100),
  lastName: z.string().min(1, "Apellido requerido").max(100),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),

  // Datos fiscales AFIP
  taxId: CuitSchema,
  taxType: z
    .enum(["consumidor_final", "responsable_inscripto", "monotributista", "exento"])
    .default("consumidor_final"),

  // Dirección
  address: AddressSchema.optional(),

  // Organización
  branchId: z.string().optional(),
  tags: z.array(z.string().max(50)).default([]),
  notes: z.string().max(2000).optional(),
  status: z.enum(["active", "inactive", "blocked"]).default("active"),

  // Lista de precios personalizada
  priceListId: z.string().optional(),

  // Cuenta corriente
  creditLimit: z.coerce.number().min(0).default(0),
});

export const UpdateCustomerSchema = CreateCustomerSchema.partial();

export const CustomerQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.enum(["active", "inactive", "blocked"]).optional(),
  branchId: z.string().optional(),
  taxType: z.enum(["consumidor_final", "responsable_inscripto", "monotributista", "exento"]).optional(),
  hasDebt: z.coerce.boolean().optional(),   // creditBalance > 0
  sortBy: z.enum(["createdAt", "lastName", "totalSpent", "totalOrders", "creditBalance"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

/** PATCH /api/customers/[id]/credit */
export const AdjustCreditSchema = z.object({
  amount: z.number().refine((n) => n !== 0, "El monto no puede ser cero"),
  description: z.string().min(1, "Descripción requerida").max(200),
  /** "debit" = el cliente queda debiendo | "credit" = saldo a favor del cliente */
  type: z.enum(["debit", "credit"]),
});

export type CreateCustomerDTO = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerDTO = z.infer<typeof UpdateCustomerSchema>;
export type CustomerQuery = z.infer<typeof CustomerQuerySchema>;
export type AdjustCreditDTO = z.infer<typeof AdjustCreditSchema>;

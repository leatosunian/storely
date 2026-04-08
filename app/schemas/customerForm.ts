import { z } from "zod";

const AddressSchema = z.object({
  street:     z.string().min(1),
  city:       z.string().min(1),
  province:   z.string().min(1),
  postalCode: z.string().optional(),
  country:    z.string().default("Argentina"),
});

export const CreateCustomerSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName:  z.string().min(1).max(100),
  email:     z.string().email(),
  phone:     z.string().optional(),
  taxId:     z.string().optional(),
  taxType:   z.enum(["consumidor_final","responsable_inscripto","monotributista","exento"]).default("consumidor_final"),
  address:   AddressSchema.optional(),
  branchId:  z.string().optional(),
  tags:      z.array(z.string()).default([]),
  notes:     z.string().max(1000).optional(),
  status:    z.enum(["active","inactive","blocked"]).default("active"),
});

export const UpdateCustomerSchema = CreateCustomerSchema.partial();

export const CustomerQuerySchema = z.object({
  page:      z.coerce.number().int().positive().default(1),
  limit:     z.coerce.number().int().positive().max(100).default(20),
  search:    z.string().optional(),
  status:    z.enum(["active","inactive","blocked"]).optional(),
  branchId:  z.string().optional(),
  sortBy:    z.enum(["createdAt","lastName","totalSpent","totalOrders"]).default("createdAt"),
  sortOrder: z.enum(["asc","desc"]).default("desc"),
});

export type CreateCustomerDTO = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerDTO = z.infer<typeof UpdateCustomerSchema>;
export type CustomerQuery     = z.infer<typeof CustomerQuerySchema>;
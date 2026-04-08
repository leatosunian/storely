import { z } from "zod";

export const formSchema = z.object({
  branchCode: z.string({ message: "Ingresá un código." }).min(1, {
    message: "Ingresa un código de sucursal.",
  }),
  branchName: z.string({ message: "Ingresá un nombre." }).min(1, {
    message: "Ingresa un nombre de sucursal.",
  }),
  address: z.string({ message: "Ingresá un nombre." }).min(1, {
    message: "Ingresa un domicilio.",
  }),
  city: z.string({ message: "Ingresá un nombre." }).min(1, {
    message: "Ingresa una ciudad.",
  }),
  state: z.string({ message: "Ingresá un nombre." }).min(1, {
    message: "Ingresa una provincia.",
  }),
  phone: z.string().optional(),
  email: z.string().email({ message: "Ingresá un email válido." }).optional().or(z.literal("")),
});

import { z } from "zod";

export const formSchema = z.object({
  nombre: z.string().min(1, {
    message: "Ingresa un nombre.",
  }),
  categoryId: z.string().min(1, {
    message: "Selecciona una categoría.",
  }),
  listPrice: z.string().min(1, {
    message: "Ingresa un precio de lista.",
  }),
  profitPercent: z.string().min(1, {
    message: "Ingresa un porcentaje de ganancia.",
  }),
});

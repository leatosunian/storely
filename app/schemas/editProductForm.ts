import { z } from "zod";

export const formSchema = z.object({
    name: z.string({ message: "Ingresá un nombre." }).min(1, {
      message: "Ingresa un nombre.",
    }),
    year: z
      .string({
        message: "Ingresa un año..",
      })
      .min(4, {
        message: "Ingresa un año.",
      }),
    brand: z.string().min(1, {
      message: "Selecciona una marca.",
    }),
    kilometers: z.string().min(1, {
      message: "Ingresa un kilometraje.",
    }),
    motor: z.string().min(1, {
      message: "Ingresá un motor.",
    }),
    type: z.string().min(1, {
      message: "Selecciona un tipo de vehículo.",
    }),
    currency: z.string().min(1, {
      message: "Selecciona una moneda.",
    }),
    price: z.string().min(1, {
      message: "Ingresa un precio.",
    }),
    modelName: z.string().min(1, {
      message: "Ingresá un modelo.",
    }),
    status: z.string().min(1, {
      message: "Seleccioná un estado.",
    }),
    gearbox: z.string().min(1, {
      message: "Selecciona una transmisión",
    }),
    doors: z.string().min(1, {
      message: "Selecciona una cantidad de puertas.",
    }),
    gas: z.string().min(1, {
      message: "Selecciona un combustible.",
    }),
    description: z.string().optional().or(z.literal("")),
    imagePath: z.string().optional(),
    show: z.boolean(),
    branchID: z.string().min(1, {
      message: "Selecciona una sucursal.",
    }),
  });
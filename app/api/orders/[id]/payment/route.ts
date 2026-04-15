import { orderService } from "@/services/orderService";
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

const PAYMENT_METHODS = ["cash", "transfer", "debit_card", "credit_card", "mercadopago", "modo", "uala", "naranja_x", "personal_pay", "cuenta_dni", "qr", "cheque", "other"] as const;

const UpdatePaymentSchema = z.object({
  paymentStatus: z.enum(["pending", "paid", "partial", "refunded", "failed"]),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  installments: z.object({
    quantity:     z.number().int().min(1).max(60),
    withInterest: z.boolean(),
  }).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const dto = UpdatePaymentSchema.parse(body);
    const order = await orderService.updatePayment(id, dto);
    return NextResponse.json({ success: true, data: order });
  } catch (err) {
    if (err instanceof ZodError)
      return NextResponse.json({ success: false, errors: err.errors }, { status: 400 });
    const msg = (err as Error).message;
    const status = msg.includes("no encontrado") ? 404 : 500;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}

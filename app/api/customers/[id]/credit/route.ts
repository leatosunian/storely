import { AdjustCreditSchema } from "@/app/schemas/customerForm";
import { customerService } from "@/services/customerService";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/customers/[id]/credit
 *  Ajusta el saldo de cuenta corriente del cliente.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const dto = AdjustCreditSchema.parse(body);
    const updated = await customerService.adjustCredit(id, dto);
    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    if (err instanceof ZodError)
      return NextResponse.json({ success: false, errors: err.errors }, { status: 400 });
    const msg = (err as Error).message;
    const status = msg.includes("no encontrado") ? 404 : 500;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}

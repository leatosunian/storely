import { UpdateCustomerSchema } from "@/app/schemas/customerForm";
import { customerService } from "@/services/customerService";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const customer = await customerService.findById(id);
    return NextResponse.json({ success: true, data: customer });
  } catch (err) {
    const msg    = (err as Error).message;
    const status = msg.includes("no encontrado") ? 404 : 500;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body   = await req.json();
    const data   = UpdateCustomerSchema.parse(body);
    const updated = await customerService.update(id, data);
    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    if (err instanceof ZodError)
      return NextResponse.json({ success: false, errors: err.errors }, { status: 400 });
    const msg    = (err as Error).message;
    const status = msg.includes("no encontrado") ? 404 : 500;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await customerService.delete(id);
    return NextResponse.json({ success: true, message: "Cliente desactivado" });
  } catch (err) {
    const msg    = (err as Error).message;
    const status = msg.includes("no encontrado") ? 404 : 500;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
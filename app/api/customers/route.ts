import { CreateCustomerSchema, CustomerQuerySchema } from "@/app/schemas/customerForm";
import { customerService } from "@/services/customerService";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const query  = CustomerQuerySchema.parse(params);
    const result = await customerService.findAll(query);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    if (err instanceof ZodError)
      return NextResponse.json({ success: false, errors: err.errors }, { status: 400 });
    return NextResponse.json({ success: false, message: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body     = await req.json();
    const data     = CreateCustomerSchema.parse(body);
    const customer = await customerService.create(data);
    return NextResponse.json({ success: true, data: customer }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError)
      return NextResponse.json({ success: false, errors: err.errors }, { status: 400 });
    const msg = (err as Error).message;
    const status = msg.includes("Ya existe") ? 409 : 500;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
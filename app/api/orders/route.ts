import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { CreateOrderSchema, OrderQuerySchema } from "@/app/schemas/orderForm";
import { orderService } from "@/services/orderService";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const query  = OrderQuerySchema.parse(params);
    const result = await orderService.findAll(query);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    if (err instanceof ZodError)
      return NextResponse.json({ success: false, errors: err.errors }, { status: 400 });
    return NextResponse.json({ success: false, message: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body  = await req.json();
    const data  = CreateOrderSchema.parse(body);
    const employeeId = (session?.user as any)?.id || undefined;
    const order = await orderService.create({ ...data, employeeId });
    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError)
      return NextResponse.json({ success: false, errors: err.errors }, { status: 400 });
    return NextResponse.json({ success: false, message: (err as Error).message }, { status: 500 });
  }
}
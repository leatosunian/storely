import { NextRequest, NextResponse } from "next/server";
import { OrderQuerySchema } from "@/app/schemas/orderForm";
import { orderService } from "@/services/orderService";
type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id }  = await params;
    const qParams = Object.fromEntries(req.nextUrl.searchParams);
    const query   = OrderQuerySchema.parse({ ...qParams, customerId: id });
    const result  = await orderService.findAll(query);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return NextResponse.json({ success: false, message: (err as Error).message }, { status: 500 });
  }
}
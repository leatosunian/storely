import { orderService } from "@/services/orderService";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { UpdateOrderStatusSchema } from "@/app/schemas/orderForm";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const body = await req.json();
        const dto = UpdateOrderStatusSchema.parse(body);
        const order = await orderService.updateStatus(id, dto);
        return NextResponse.json({ success: true, data: order });
    } catch (err) {
        if (err instanceof ZodError)
            return NextResponse.json({ success: false, errors: err.errors }, { status: 400 });
        const msg = (err as Error).message;
        const status = msg.includes("no encontrada") ? 404 : msg.includes("inválida") ? 422 : 500;
        return NextResponse.json({ success: false, message: msg }, { status });
    }
}
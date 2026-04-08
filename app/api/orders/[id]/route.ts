import { orderService } from "@/services/orderService";
import { NextRequest, NextResponse } from "next/server";


type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const order = await orderService.findById(id);
        return NextResponse.json({ success: true, data: order });
    } catch (err) {
        const msg = (err as Error).message;
        const status = msg.includes("no encontrado") ? 404 : 500;
        return NextResponse.json({ success: false, message: msg }, { status });
    }
}
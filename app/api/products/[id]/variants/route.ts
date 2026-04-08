import connectDB from "@/lib/db/db";
import { NextRequest, NextResponse } from "next/server";
import VariantModel from "@/lib/db/models/variant";
import { addVariantToProduct } from "@/services/productService";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  try {
    const { id } = await params;
    const variants = await VariantModel.find({ productId: id, isActive: true })
      .sort({ createdAt: 1 })
      .lean();
    return NextResponse.json(variants);
  } catch {
    return NextResponse.json({ msg: "ERROR_GET_VARIANTS" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  try {
    const { id } = await params;
    const body = await request.json();

    const variant = await addVariantToProduct(id, {
      sku: body.sku,
      attributes: body.attributes ?? {},
      priceDelta: Number(body.priceDelta) || 0,
      customPrice: body.customPrice != null ? Number(body.customPrice) : undefined,
      barcode: body.barcode || undefined,
    });

    return NextResponse.json(variant, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ msg: err.message || "ERROR_CREATE_VARIANT" }, { status: 500 });
  }
}

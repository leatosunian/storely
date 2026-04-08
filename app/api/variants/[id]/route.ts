import connectDB from "@/lib/db/db";
import { NextRequest, NextResponse } from "next/server";
import VariantModel from "@/lib/db/models/variant";
import StockModel from "@/lib/db/models/stock";

// GET /api/variants/[id] — fetch all active variants for a productId
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  try {
    const { id } = await params;
    const variants = await VariantModel.find({ productId: id, isActive: true });
    return NextResponse.json(variants);
  } catch {
    return NextResponse.json({ msg: "ERROR_GET_VARIANTS" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await VariantModel.findByIdAndUpdate(
      id,
      {
        sku: body.sku?.toUpperCase().trim(),
        attributes: body.attributes,
        priceDelta: Number(body.priceDelta) || 0,
        barcode: body.barcode || undefined,
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ msg: "VARIANT_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ msg: err.message || "ERROR_UPDATE_VARIANT" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  try {
    const { id } = await params;

    const variant = await VariantModel.findById(id);
    if (!variant) {
      return NextResponse.json({ msg: "VARIANT_NOT_FOUND" }, { status: 404 });
    }
    if (variant.isDefault) {
      return NextResponse.json(
        { msg: "No se puede eliminar la variante por defecto." },
        { status: 400 }
      );
    }

    // Soft-delete variant and its stock entries
    await VariantModel.findByIdAndUpdate(id, { isActive: false });
    await StockModel.deleteMany({ variantId: id });

    return NextResponse.json({ msg: "VARIANT_DELETED" });
  } catch {
    return NextResponse.json({ msg: "ERROR_DELETE_VARIANT" }, { status: 500 });
  }
}

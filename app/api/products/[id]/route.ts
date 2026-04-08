import connectDB from "@/lib/db/db";
import { NextRequest, NextResponse } from "next/server";
import ProductModel from "@/lib/db/models/product";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  try {
    const { id } = await params;
    const product = await ProductModel.findById(id);
    if (!product) {
      return NextResponse.json({ msg: "PRODUCT_NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ msg: "ERROR_GET_PRODUCT" }, { status: 500 });
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

    const publicPrice =
      Number(body.listPrice) * (1 + Number(body.profitPercent ?? 0) / 100);

    const updated = await ProductModel.findByIdAndUpdate(
      id,
      { ...body, publicPrice },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ msg: "PRODUCT_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ msg: "ERROR_EDIT_PRODUCT" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  try {
    const { id } = await params;
    const deleted = await ProductModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!deleted) {
      return NextResponse.json({ msg: "PRODUCT_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ msg: "PRODUCT_DELETED" });
  } catch {
    return NextResponse.json({ msg: "ERROR_DELETE_PRODUCT" }, { status: 500 });
  }
}

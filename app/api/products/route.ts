import connectDB from "@/lib/db/db";
import { NextRequest, NextResponse } from "next/server";
import ProductModel from "@/lib/db/models/product";
import { createProduct, createProductWithVariants } from "@/services/productService";

export async function GET(_request: NextRequest) {
  await connectDB();
  try {
    const products = await ProductModel.find({ isActive: { $ne: false } }).sort({ updatedAt: -1 });
    return NextResponse.json(products);
  } catch {
    return NextResponse.json({ msg: "ERROR_GET_PRODUCTS" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  await connectDB();
  try {
    const body = await request.json();
    const hasVariants = body.hasVariants === true;

    if (hasVariants && Array.isArray(body.variants) && body.variants.length > 0) {
      const product = await createProductWithVariants({
        nombre: body.nombre,
        categoryId: body.categoryId,
        categoryPath: body.categoryPath ?? "",
        listPrice: Number(body.listPrice),
        profitPercent: body.profitPercent !== undefined && body.profitPercent !== "" ? Number(body.profitPercent) : undefined,
        marca: body.marca || undefined,
        modelo: body.modelo || undefined,
        hasVariants: true,
        attributeSchema: body.attributeSchema ?? [],
        gallery: Array.isArray(body.gallery) ? body.gallery : [],
        variantInputs: body.variants.map((v: any) => ({
          sku: v.sku,
          attributes: v.attributes ?? {},
          priceDelta: Number(v.priceDelta) || 0,
          customPrice: v.customPrice != null ? Number(v.customPrice) : undefined,
          barcode: v.barcode || undefined,
        })),
      });
      return NextResponse.json(product, { status: 201 });
    }

    // Simple product — default variant + stock created inside service
    const product = await createProduct({
      nombre: body.nombre,
      categoryId: body.categoryId,
      categoryPath: body.categoryPath ?? "",
      listPrice: Number(body.listPrice),
      profitPercent: body.profitPercent !== undefined && body.profitPercent !== "" ? Number(body.profitPercent) : undefined,
      marca: body.marca || undefined,
      modelo: body.modelo || undefined,
      gallery: Array.isArray(body.gallery) ? body.gallery : [],
    });

    return NextResponse.json(product, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ msg: err.message || "ERROR_CREATE_PRODUCT" }, { status: 500 });
  }
}

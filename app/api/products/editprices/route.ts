import connectDB from "@/lib/db/db";
import { NextRequest, NextResponse } from "next/server";
import ProductModel from "@/lib/db/models/product";
import { IProduct } from "@/interfaces/IProduct";

export async function PUT(request: NextRequest) {
  await connectDB();
  try {
    const products: Partial<IProduct>[] = await request.json();

    if (!Array.isArray(products)) {
      return NextResponse.json(
        { msg: "INVALID_DATA_FORMAT" },
        { status: 400 }
      );
    }

    const bulkOperations = products.map((product) => ({
      updateOne: {
        filter: { _id: product._id },
        update: {
          $set: {
            nombre:       product.nombre,
            marca:        product.marca,
            categoryId:   product.categoryId,
            categoryPath: product.categoryPath,
            listPrice:    product.listPrice,
            publicPrice:  product.publicPrice,
            profitPercent:product.profitPercent,
          },
        },
      },
    }));

    const result = await ProductModel.bulkWrite(bulkOperations);
    return NextResponse.json({ msg: "PRODUCTS_PRICES_MODIFIED", result });
  } catch {
    return NextResponse.json(
      { msg: "ERROR_MODIFY_PRODUCTS_PRICES" },
      { status: 500 }
    );
  }
}
import connectDB from "@/lib/db/db";
import { NextRequest, NextResponse } from "next/server";
import StockModel from "@/lib/db/models/stock";
import VariantModel from "@/lib/db/models/variant";
import { getStockByProductAndBranch } from "@/services/productService";

// GET /api/stocks?productId=xxx              → all variants, all branches
// GET /api/stocks?productId=xxx&branchId=yyy → per-variant stock at specific branch
export async function GET(request: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const branchId = searchParams.get("branchId");

  if (!productId) {
    return NextResponse.json({ msg: "productId is required" }, { status: 400 });
  }

  // case branch: retorna stock por variante de producto en sucursal seleccionada
  if (branchId) {
    try {
      const result = await getStockByProductAndBranch(productId, branchId);
      return NextResponse.json(result);
    } catch {
      return NextResponse.json({ msg: "ERROR_GET_STOCK_BY_BRANCH" }, { status: 500 });
    }
  }

  // case general: retorna stock por variante de producto en cad una de las sucursales
  try {
    const variants = await VariantModel.find({ productId, isActive: true }).lean();

    const stockData = await Promise.all(
      variants.map(async (variant) => {
        const stocks = await StockModel.find({ variantId: variant._id })
          .populate("branchId", "branchName branchCode")
          .lean();
        return { variant, stocks };
      })
    );

    return NextResponse.json(stockData);
  } catch {
    return NextResponse.json({ msg: "ERROR_GET_STOCKS" }, { status: 500 });
  }
}

// PUT /api/stocks
// Body: { stockId, quantityOnHand }
export async function PUT(request: NextRequest) {
  await connectDB();
  try {
    const { stockId, quantityOnHand } = await request.json();
    const qty = Math.max(0, Number(quantityOnHand));

    const stock = await StockModel.findById(stockId);
    if (!stock) {
      return NextResponse.json({ msg: "STOCK_NOT_FOUND" }, { status: 404 });
    }

    stock.quantityOnHand = qty;
    stock.quantityAvailable = Math.max(0, qty - stock.quantityReserved);
    stock.lastUpdatedAt = new Date();
    await stock.save();

    const populated = await StockModel.findById(stockId)
      .populate("branchId", "branchName branchCode")
      .lean();

    return NextResponse.json(populated);
  } catch {
    return NextResponse.json({ msg: "ERROR_UPDATE_STOCK" }, { status: 500 });
  }
}

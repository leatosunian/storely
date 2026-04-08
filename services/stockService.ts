// services/stockService.ts

import StockModel from "@/lib/db/models/stock";
import { Types } from "mongoose";

// Stock total de un producto (suma de todas sus variantes, todas las branches)
async function getStockTotalByProduct(productId: string) {
  const result = await StockModel.aggregate([
    {
      $lookup: {
        from: "variants",
        localField: "variantId",
        foreignField: "_id",
        as: "variant",
      },
    },
    { $unwind: "$variant" },
    {
      $match: {
        "variant.productId": new Types.ObjectId(productId),
        "variant.isActive": true,
      },
    },
    {
      $group: {
        _id: "$variant.productId",
        totalOnHand:    { $sum: "$quantityOnHand" },
        totalReserved:  { $sum: "$quantityReserved" },
        totalAvailable: { $sum: "$quantityAvailable" },
      },
    },
  ]);

  return result[0] ?? { totalOnHand: 0, totalReserved: 0, totalAvailable: 0 };
}

// Stock por variante, desglosado por branch (para vista de detalle)
async function getStockByVariant(variantId: string) {
  return StockModel.find({ variantId })
    .populate("branchId", "branchName branchCode")
    .lean();
}

// Stock total por producto POR branch (para el panel de sucursal)
async function getStockByProductAndBranch(productId: string, branchId: string) {
  const result = await StockModel.aggregate([
    {
      $lookup: {
        from: "variants",
        localField: "variantId",
        foreignField: "_id",
        as: "variant",
      },
    },
    { $unwind: "$variant" },
    {
      $match: {
        "variant.productId": new Types.ObjectId(productId),
        branchId: new Types.ObjectId(branchId),
        "variant.isActive": true,
      },
    },
    {
      $group: {
        _id: null,
        totalAvailable: { $sum: "$quantityAvailable" },
        byVariant: {
          $push: {
            variantId:  "$variantId",
            attributes: "$variant.attributes",
            sku:        "$variant.sku",
            available:  "$quantityAvailable",
            onHand:     "$quantityOnHand",
          },
        },
      },
    },
  ]);

  return result[0] ?? { totalAvailable: 0, byVariant: [] };
}
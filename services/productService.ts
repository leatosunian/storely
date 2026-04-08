import mongoose, { Types } from "mongoose";
import ProductModel from "@/lib/db/models/product";
import VariantModel from "@/lib/db/models/variant";
import StockModel from "@/lib/db/models/stock";
import BranchModel from "@/lib/db/models/branch";
import { IAttributeDefinition, IProductImage } from "@/interfaces/IProduct";

// ─── Simple product (no variants) ────────────────────────────────────────────

export interface CreateProductDTO {
  nombre: string;
  marca?: string;
  modelo?: string;
  categoryId: Types.ObjectId | string;
  categoryPath: string;
  listPrice: number;
  profitPercent?: number;
  gallery?: IProductImage[];
}

export async function createProduct(data: CreateProductDTO) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const publicPrice = data.listPrice * (1 + (data.profitPercent ?? 0) / 100);

    const [product] = await ProductModel.create(
      [{ ...data, publicPrice, hasVariants: false, attributeSchema: [] }],
      { session }
    );

    const [defaultVariant] = await VariantModel.create(
      [{
        productId: product._id,
        sku: `${product._id}-DEFAULT`,
        attributes: {},
        isDefault: true,
        priceDelta: 0,
      }],
      { session }
    );

    const branches = await BranchModel.find({}, "_id").lean();
    const stockDocs = branches.map((branch) => ({
      variantId: defaultVariant._id,
      branchId: branch._id,
      quantityOnHand: 0,
      quantityReserved: 0,
      quantityAvailable: 0,
    }));

    if (stockDocs.length > 0) {
      await StockModel.insertMany(stockDocs, { session });
    }

    await session.commitTransaction();
    return product;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

// ─── Product with variants ────────────────────────────────────────────────────

export interface VariantInput {
  sku: string;
  attributes: Record<string, string>;
  priceDelta: number;
  customPrice?: number;
  barcode?: string;
}

export interface CreateProductWithVariantsDTO {
  nombre: string;
  marca?: string;
  modelo?: string;
  categoryId: Types.ObjectId | string;
  categoryPath: string;
  listPrice: number;
  profitPercent?: number;
  hasVariants: boolean;
  attributeSchema: IAttributeDefinition[];
  variantInputs: VariantInput[];
  gallery?: IProductImage[];
}

export async function createProductWithVariants(data: CreateProductWithVariantsDTO) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const publicPrice = data.listPrice * (1 + (data.profitPercent ?? 0) / 100);
    const { variantInputs, ...productData } = data;

    const [product] = await ProductModel.create(
      [{ ...productData, publicPrice }],
      { session }
    );

    const variantDocs = variantInputs.map((v) => ({
      productId: product._id,
      sku: v.sku.toUpperCase().trim(),
      attributes: v.attributes,
      isDefault: false,
      priceDelta: v.priceDelta ?? 0,
      customPrice: v.customPrice ?? undefined,
      barcode: v.barcode || undefined,
      isActive: true,
    }));

    const createdVariants = await VariantModel.create(variantDocs, { session });

    const branches = await BranchModel.find({}, "_id").lean();
    const stockDocs = createdVariants.flatMap((variant) =>
      branches.map((branch) => ({
        variantId: variant._id,
        branchId: branch._id,
        quantityOnHand: 0,
        quantityReserved: 0,
        quantityAvailable: 0,
      }))
    );

    if (stockDocs.length > 0) {
      await StockModel.insertMany(stockDocs, { session });
    }

    await session.commitTransaction();
    return product;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

// ─── Add a single variant to an existing product ─────────────────────────────

export async function addVariantToProduct(productId: string, variantInput: VariantInput) {
  const variant = await VariantModel.create({
    productId: new Types.ObjectId(productId),
    sku: variantInput.sku.toUpperCase().trim(),
    attributes: variantInput.attributes,
    isDefault: false,
    priceDelta: variantInput.priceDelta ?? 0,
    customPrice: variantInput.customPrice ?? undefined,
    barcode: variantInput.barcode || undefined,
    isActive: true,
  });

  const branches = await BranchModel.find({}, "_id").lean();
  const stockDocs = branches.map((branch) => ({
    variantId: variant._id,
    branchId: branch._id,
    quantityOnHand: 0,
    quantityReserved: 0,
    quantityAvailable: 0,
  }));

  if (stockDocs.length > 0) {
    await StockModel.insertMany(stockDocs);
  }

  // Mark the product as having variants
  await ProductModel.findByIdAndUpdate(productId, { hasVariants: true });

  return variant;
}

// ─── Stock queries ────────────────────────────────────────────────────────────

export async function getStockTotalByProduct(productId: string) {
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

export async function getStockByVariant(variantId: string) {
  return StockModel.find({ variantId })
    .populate("branchId", "branchName branchCode")
    .lean();
}

export async function getStockByProductAndBranch(productId: string, branchId: string) {
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
            sku:        "$variant.sku",
            attributes: "$variant.attributes",
            available:  "$quantityAvailable",
            onHand:     "$quantityOnHand",
          },
        },
      },
    },
  ]);

  return result[0] ?? { totalAvailable: 0, byVariant: [] };
}

import { Document, Types } from "mongoose";

// interfaces/IVariant.ts
export interface IVariant extends Document {
  _id?: string;
  productId: Types.ObjectId;
  sku: string;
  attributes: Record<string, string>; // {} para variante default
  isDefault: boolean;                 // true solo en productos sin variantes
  priceDelta: number;                 // ajuste sobre precioAlPublico del producto
  customPrice?: number;               // precio individual; si no se define, hereda del producto
  barcode?: string;
  isActive: boolean;
}
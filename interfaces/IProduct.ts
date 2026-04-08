import { Document, Types } from "mongoose";

export interface IAttributeDefinition {
  key: string;
  label: string;
  values: string[];
  order: number;
}

export interface IProductImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

export interface IProduct extends Document {
  _id?: string;
  nombre: string;
  marca?: string;
  modelo?: string;
  categoryId: Types.ObjectId;
  categoryPath: string;
  listPrice: number;
  publicPrice: number;
  profitPercent?: number;
  hasVariants: boolean;
  attributeSchema: IAttributeDefinition[];
  gallery: IProductImage[];
  isActive: boolean;
}
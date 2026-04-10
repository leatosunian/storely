import { IProduct } from "@/interfaces/IProduct";
import { model, Schema, models } from "mongoose";

const productSchema = new Schema<IProduct>(
  {
    nombre: { type: String, required: true },
    marca:  { type: String },
    modelo: { type: String },
    internalCode: { type: String, trim: true },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "categories",
      required: true,
      index: true,
    },
    categoryPath: { type: String, required: true, index: true },
    listPrice:    { type: Number, required: true },
    publicPrice:  { type: Number, required: true },
    profitPercent:{ type: Number },
    hasVariants:  { type: Boolean, default: false, index: true },
    attributeSchema: [
      {
        key:    { type: String, required: true },
        label:  { type: String, required: true },
        values: [{ type: String }],
        order:  { type: Number, default: 0 },
      },
    ],
    gallery: [
      {
        url:      { type: String, required: true },
        publicId: { type: String, required: true },
        width:    { type: Number, required: true },
        height:   { type: Number, required: true },
      },
    ],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, versionKey: false }
);

const ProductModel = models.products || model("products", productSchema);

export default ProductModel;
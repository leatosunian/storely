import { IVariant } from "@/interfaces/IVariant";
import { model, Schema, models } from "mongoose";

const variantSchema = new Schema<IVariant>(
    {
        productId: { type: Schema.Types.ObjectId, ref: "products", required: true, index: true },
        sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
        attributes: { type: Schema.Types.Mixed, default: {} },
        isDefault: { type: Boolean, default: false },
        priceDelta: { type: Number, default: 0 },
        barcode: { type: String },
        isActive: { type: Boolean, default: true, index: true },
    },
    { timestamps: true, versionKey: false }
);

variantSchema.index({ productId: 1, isActive: 1 });
variantSchema.index(
    { productId: 1, isDefault: 1 },
    { unique: true, partialFilterExpression: { isDefault: true } }
    // garantiza que no haya dos variantes default para el mismo producto
);

const VariantModel = models.variants || model<IVariant>("variants", variantSchema);

export default VariantModel;

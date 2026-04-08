import { IStock } from "@/interfaces/IStock";
import { model, Schema, models } from "mongoose";

const stockSchema = new Schema<IStock>(
  {
    variantId: { type: Schema.Types.ObjectId, ref: "variants", required: true },
    branchId:  { type: Schema.Types.ObjectId, ref: "branches", required: true },
    quantityOnHand:      { type: Number, required: true, default: 0, min: 0 },
    quantityReserved:    { type: Number, required: true, default: 0, min: 0 },
    quantityAvailable:   { type: Number, required: true, default: 0 },
    reorderPoint:        { type: Number, default: 0 },
    lastUpdatedAt:       { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false }
);

// la combinación variant+branch es única: un solo doc de stock por variante por sucursal
stockSchema.index({ variantId: 1, branchId: 1 }, { unique: true });
stockSchema.index({ branchId: 1, quantityAvailable: 1 }); // para alertas de reposición

const StockModel = models.stocks || model<IStock>("stocks", stockSchema);

export default StockModel;

import { Document, Types } from "mongoose";

export interface IStock extends Document {
  _id?: string;
  variantId: Types.ObjectId;
  branchId: Types.ObjectId;
  quantityOnHand: number;      // físico real
  quantityReserved: number;    // comprometido en órdenes pendientes
  quantityAvailable: number;   // onHand - reserved (virtual, para lecturas rápidas)
  reorderPoint: number;        // si baja de este número, alertar
  lastUpdatedAt: Date;
}
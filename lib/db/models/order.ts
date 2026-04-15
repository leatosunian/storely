import { IOrder, IOrderItem } from "@/interfaces/IOrder";
import { Schema, model, models } from "mongoose";

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: Schema.Types.ObjectId },
    sku:       { type: String, required: true },
    name:      { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity:  { type: Number, required: true, min: 1 },
    discount:  { type: Number, default: 0, min: 0, max: 100 },
    subtotal:  { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber:  { type: String, required: true, unique: true },
    customerId:   { type: Schema.Types.ObjectId, ref: "customers", required: true },
    branchId:     { type: Schema.Types.ObjectId, ref: "branches", required: true },
    employeeId:   { type: Schema.Types.ObjectId, ref: "admin_users" },
    items:        { type: [OrderItemSchema], required: true, validate: (v: IOrderItem[]) => v.length > 0 },
    subtotal:     { type: Number, required: true, min: 0 },
    discountTotal:{ type: Number, default: 0, min: 0 },
    tax:          { type: Number, default: 0, min: 0 },
    shippingCost: { type: Number, default: 0, min: 0 },
    total:        { type: Number, required: true, min: 0 },
    status:       {
      type: String,
      enum: ["pending","confirmed","processing","shipped","delivered","cancelled","refunded"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending","paid","partial","refunded","failed"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cash","transfer","debit_card","credit_card","mercadopago","modo","uala","naranja_x","personal_pay","cuenta_dni","qr","cheque","other"],
    },
    installments: {
      quantity:     { type: Number, min: 1, max: 60 },
      withInterest: { type: Boolean },
    },
    notes:          { type: String, maxlength: 2000 },
    shippingType:   { type: String, enum: ["delivery", "pickup"] },
    shippingAddress:{ type: Schema.Types.Mixed },
    pickupBranchId: { type: Schema.Types.ObjectId, ref: "Branch" },
    cancelReason:   { type: String },
    statusHistory:  {
      type: [{
        status:    { type: String, required: true },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: Schema.Types.ObjectId },
        note:      { type: String },
      }],
      default: [],
    },
  },
  { timestamps: true, versionKey: false }
);

OrderSchema.index({ customerId: 1 });
OrderSchema.index({ branchId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ createdAt: -1 });

export const OrderModel =
  models.orders ?? model<IOrder>("orders", OrderSchema);
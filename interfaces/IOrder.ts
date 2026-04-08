import { Document, Types } from "mongoose";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus = "pending" | "paid" | "partial" | "refunded" | "failed";
export type PaymentMethod = "cash" | "transfer" | "card" | "mercadopago" | "other";

export interface IOrderItem {
  productId: Types.ObjectId;
  variantId?: Types.ObjectId;
  sku: string;
  name: string;         // desnormalizado
  unitPrice: number;
  quantity: number;
  discount: number;     // porcentaje 0-100
  subtotal: number;     // unitPrice * quantity * (1 - discount/100)
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  orderNumber: string;  // ej: "ORD-2024-00123"
  customerId: Types.ObjectId;
  branchId: Types.ObjectId;
  employeeId?: Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  discountTotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  notes?: string;
  shippingAddress?: {
    street: string;
    city: string;
    province: string;
    postalCode?: string;
    country: string;
  };
  cancelReason?: string;
  statusHistory: Array<{
    status: OrderStatus;
    changedAt: Date;
    changedBy?: Types.ObjectId;
    note?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
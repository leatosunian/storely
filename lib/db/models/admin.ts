import { Document, model, Schema, models } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { Types } from "mongoose";

export const ACCOUNT_STATUS = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;
export type AccountStatus = (typeof ACCOUNT_STATUS)[number];

export interface IAdmin extends Document {
  name: string;
  surname: string;
  username: string;
  password?: string;
  uuid: string;
  role: "ADMIN" | "EMPLOYEE";
  phone: string;
  branchId?: Types.ObjectId;
  email: string;
  department: string;
  status: AccountStatus;
  isActive: boolean;
  _id?: string;
}

const adminSchema: Schema = new Schema<IAdmin>(
  {
    username: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    surname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    uuid: {
      type: String,
      required: true,
      default: uuidv4,
      unique: true
    },
    department: { // area (ventas, logistica, etc.)
      type: String,
      trim: true,
      required: true
    }, 
    role: {
      type: String,
      enum: ["ADMIN", "EMPLOYEE"],
    },
    isActive: { type: Boolean, default: true, index: true },
    status: {
      type: String,
      enum: ACCOUNT_STATUS,
      required: true,
      default: "ACTIVE",
    },
    branchId: { // referencia a la sucursal a la que pertenece el user
      type: Schema.Types.ObjectId,
      ref: "branches", // referencia al modelo de sucursal
      required: false, // puede no tener sucursal
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const AdminModel = models.admin_users || model("admin_users", adminSchema);

export default AdminModel;

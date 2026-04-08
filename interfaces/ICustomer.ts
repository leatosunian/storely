import { Document, Types } from "mongoose";
import { IAddress } from "./IAddress";

export interface ICustomer extends Document {
    _id: Types.ObjectId;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    taxId?: string;
    taxType?: "consumidor_final" | "responsable_inscripto" | "monotributista" | "exento";
    address?: IAddress;
    branchId?: Types.ObjectId;
    tags: string[];
    notes?: string;
    status: "active" | "inactive" | "blocked";
    totalOrders: number;
    totalSpent: number;
    lastOrderAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
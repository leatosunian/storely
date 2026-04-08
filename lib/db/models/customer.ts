import { IAddress } from "@/interfaces/IAddress";
import { ICustomer } from "@/interfaces/ICustomer";
import { Schema, model, models } from "mongoose";

const AddressSchema = new Schema<IAddress>(
    {
        street: { type: String, required: true },
        city: { type: String, required: true },
        province: { type: String, required: true },
        postalCode: { type: String },
        country: { type: String, default: "Argentina" },
    },
    { _id: false }
);

const CustomerSchema = new Schema<ICustomer>(
    {
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        phone: { type: String, trim: true },
        taxId: { type: String },
        taxType: {
            type: String,
            enum: ["consumidor_final", "responsable_inscripto", "monotributista", "exento"],
            default: "consumidor_final",
        },
        address: { type: AddressSchema },
        branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
        tags: { type: [String], default: [] },
        notes: { type: String, maxlength: 1000 },
        status: { type: String, enum: ["active", "inactive", "blocked"], default: "active" },
        totalOrders: { type: Number, default: 0 },
        totalSpent: { type: Number, default: 0 },
        lastOrderAt: { type: Date },
    },
    { timestamps: true, versionKey: false }
);

CustomerSchema.index({ status: 1 });
CustomerSchema.index({ branchId: 1 });
CustomerSchema.index({ lastName: 1, firstName: 1 });
CustomerSchema.index({ tags: 1 });

export const CustomerModel = models.Customer ?? model<ICustomer>("Customer", CustomerSchema);
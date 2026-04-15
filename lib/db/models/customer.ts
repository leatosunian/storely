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
    // ── Datos personales ────────────────────────────────────────────────
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },

    // ── Datos fiscales AFIP ─────────────────────────────────────────────
    /**
     * CUIT sin guiones (11 dígitos).
     * sparse: true → permite múltiples documentos sin taxId (null/undefined)
     * sin violar la unicidad.
     */
    taxId: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },
    taxType: {
      type: String,
      enum: ["consumidor_final", "responsable_inscripto", "monotributista", "exento"],
      default: "consumidor_final",
    },

    // ── Dirección ───────────────────────────────────────────────────────
    address: { type: AddressSchema },

    // ── Organización ───────────────────────────────────────────────────
    branchId: { type: Schema.Types.ObjectId, ref: "branches" },
    tags: { type: [String], default: [] },
    notes: { type: String, maxlength: 2000 },
    status: { type: String, enum: ["active", "inactive", "blocked"], default: "active" },

    // ── Lista de precios personalizada ──────────────────────────────────
    priceListId: { type: Schema.Types.ObjectId, ref: "PriceList", default: null },

    // ── Cuenta corriente ───────────────────────────────────────────────
    creditLimit: { type: Number, default: 0, min: 0 },
    creditBalance: { type: Number, default: 0 },  // puede ser negativo (saldo a favor)

    // ── Stats denormalizadas ────────────────────────────────────────────
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastOrderAt: { type: Date },
  },
  { timestamps: true, versionKey: false }
);

// ── Índices ──────────────────────────────────────────────────────────────
CustomerSchema.index({ status: 1 });
CustomerSchema.index({ branchId: 1 });
CustomerSchema.index({ lastName: 1, firstName: 1 });
CustomerSchema.index({ tags: 1 });
CustomerSchema.index({ creditBalance: 1 });  // útil para filtrar deudores

// taxId ya tiene index implícito por unique:true + sparse:true en el campo

export const CustomerModel =
  models.customers ?? model<ICustomer>("customers", CustomerSchema);

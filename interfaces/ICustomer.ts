import { Document, Types } from "mongoose";
import { IAddress } from "./IAddress";

export type TaxType =
  | "consumidor_final"
  | "responsable_inscripto"
  | "monotributista"
  | "exento";

export type CustomerStatus = "active" | "inactive" | "blocked";

/**
 * Condición frente al IVA → tipo de comprobante AFIP
 *  - consumidor_final      → Factura B
 *  - responsable_inscripto → Factura A
 *  - monotributista        → Factura B / C
 *  - exento                → Factura B
 */
export const TAX_TYPE_LABELS: Record<TaxType, string> = {
  consumidor_final: "Consumidor Final",
  responsable_inscripto: "Responsable Inscripto",
  monotributista: "Monotributista",
  exento: "Exento",
};

export const TAX_TYPE_INVOICE: Record<TaxType, string> = {
  consumidor_final: "Factura B",
  responsable_inscripto: "Factura A",
  monotributista: "Factura B",
  exento: "Factura B",
};

export interface ICustomer extends Document {
  _id: Types.ObjectId;

  // ── Datos personales ──────────────────────────────────────────────────
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;

  // ── Datos fiscales AFIP ───────────────────────────────────────────────
  /** CUIT/CUIL sin guiones: 11 dígitos. Sparse unique index. */
  taxId?: string;
  taxType?: TaxType;

  // ── Dirección ─────────────────────────────────────────────────────────
  address?: IAddress;

  // ── Organización ──────────────────────────────────────────────────────
  branchId?: Types.ObjectId;
  tags: string[];
  notes?: string;
  status: CustomerStatus;

  // ── Lista de precios personalizada ────────────────────────────────────
  /** Ref futura a PriceListModel. Null = usa lista general. */
  priceListId?: Types.ObjectId;

  // ── Cuenta corriente ─────────────────────────────────────────────────
  /** Límite de crédito en ARS. 0 = sin crédito habilitado. */
  creditLimit: number;
  /**
   * Saldo de cuenta corriente.
   * Positivo = cliente debe → deuda a favor del negocio.
   * Negativo = saldo a favor del cliente (pagó de más / NC).
   */
  creditBalance: number;

  // ── Stats denormalizadas ──────────────────────────────────────────────
  totalOrders: number;
  totalSpent: number;
  lastOrderAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

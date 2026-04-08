import { Document, model, Schema, models, Types } from "mongoose";

export interface ICategory extends Document {
  _id?: string;
  name: string;
  slug: string;
  path: string;               // ",electrónica,computadoras,notebooks,"
  parentId: Types.ObjectId | null;
  level: number;               // 0 = raíz, 1 = hijo, 2 = nieto...
  order: number;               // para ordenar hermanos
  isActive: boolean;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    path: {
      type: String,
      required: true,
      index: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "categories",
      default: null,
      index: true,
    },
    level: {
      type: Number,
      required: true,
      default: 0,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true, versionKey: false }
);

// indices compuestos para queries frecuentes - optimizar búsqueda por path y parent
categorySchema.index({ path: 1, isActive: 1 });
categorySchema.index({ parentId: 1, order: 1 });
// evitar duplicados: solo entre categorías activas (partial index para que
// el soft-delete no bloquee la re-creación con el mismo nombre)
categorySchema.index(
  { parentId: 1, slug: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

const CategoryModel = models.categories || model("categories", categorySchema);

export default CategoryModel;
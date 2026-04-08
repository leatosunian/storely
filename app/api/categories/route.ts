import connectDB from "@/lib/db/db";
import { NextRequest, NextResponse } from "next/server";
import {
  createRootCategory,
  createSubcategory,
  getCategoryTree,
  getDirectChildren,
} from "@/services/categoryService";

// GET: obtener árbol o hijos directos
export async function GET(request: NextRequest) {
  await connectDB();
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get("parentId");
    const tree = searchParams.get("tree");

    // /api/categories?tree=true → árbol completo
    if (tree === "true") {
      const categoryTree = await getCategoryTree();
      return NextResponse.json(categoryTree);
    }

    // /api/categories?parentId=xxx → hijos directos
    // /api/categories → categorías raíz
    const children = await getDirectChildren(parentId);
    return NextResponse.json(children);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST: crear categoría
export async function POST(request: NextRequest) {
  await connectDB();
  try {
    const { name, parentId } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    const category = parentId
      ? await createSubcategory(parentId, name)
      : await createRootCategory(name);

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
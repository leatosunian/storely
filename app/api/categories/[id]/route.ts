import connectDB from "@/lib/db/db";
import { NextRequest, NextResponse } from "next/server";
import {
  moveCategory,
  renameCategory,
  deleteCategory,
  getAncestors,
  getDescendants,
} from "@/services/categoryService";
import CategoryModel from "@/lib/db/models/category";

// GET: obtener categoría con ancestros y/o descendientes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  try {
    const { searchParams } = new URL(request.url);
    const includeAncestors = searchParams.get("ancestors") === "true";
    const includeDescendants = searchParams.get("descendants") === "true";

    const category = await CategoryModel.findById(id);
    if (!category) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    const result: any = { category };
    if (includeAncestors) result.ancestors = await getAncestors(id);
    if (includeDescendants) result.descendants = await getDescendants(id);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: actualizar nombre o mover a otra categoria padre
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  try {
    const body = await request.json();

    // Si newParentId, es un movimiento
    if (body.newParentId !== undefined) {
      const moved = await moveCategory(id, body.newParentId);
      return NextResponse.json(moved);
    }

    // Si no, renombrar (actualiza name, slug y paths)
    if (body.name) {
      const category = await renameCategory(id, body.name);
      return NextResponse.json(category);
    }

    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// soft delete
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  try {
    await deleteCategory(id);
    return NextResponse.json({ message: "Categoría eliminada" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
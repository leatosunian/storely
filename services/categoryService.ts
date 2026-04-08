// services/categoryService.ts
import CategoryModel, { ICategory } from "@/lib/db/models/category";

/**
 * Genera un slug a partir del nombre.
 * "Instalaciones Eléctricas" → "instalaciones-electricas"
 * 
 * Importante: el slug es lo que va dentro del path,
 * así que tiene que ser URL-safe y sin caracteres raros.
 */
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize("NFD")                    // separa acentos del carácter base
        .replace(/[\u0300-\u036f]/g, "")     // elimina los acentos
        .replace(/[^a-z0-9]+/g, "-")         // reemplaza todo lo que no sea alfanumérico
        .replace(/^-|-$/g, "");              // quita guiones al inicio/final
}

/**
 * Escapa caracteres especiales de regex en el path.
 * Previene inyección de regex si alguien mete caracteres raros.
 */
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// CREAR categoría raíz (nivel 0)
export async function createRootCategory(name: string) {
    const slug = generateSlug(name);

    // Verificar que no exista otra raíz activa con el mismo slug
    const existing = await CategoryModel.findOne({
        slug,
        parentId: null,
        isActive: true,
    });
    if (existing) {
        throw new Error(`Ya existe una categoría raíz "${name}"`);
    }

    // Reactivar si existe una versión soft-deleted con el mismo slug
    const softDeleted = await CategoryModel.findOne({
        slug,
        parentId: null,
        isActive: false,
    });
    if (softDeleted) {
        softDeleted.name = name;
        softDeleted.slug = slug;
        softDeleted.path = `,${slug},`;
        softDeleted.isActive = true;
        await softDeleted.save();
        return softDeleted;
    }

    // El path de una raíz es simplemente: ,slug,
    return CategoryModel.create({
        name,
        slug,
        path: `,${slug},`,
        parentId: null,
        level: 0,
        order: 0,
    });
}

// CREAR subcategoría (cualquier level)
export async function createSubcategory(
    parentId: string,
    name: string
) {
    // 1. Buscar al padre
    const parent = await CategoryModel.findById(parentId);
    if (!parent) throw new Error("Categoría padre no encontrada");

    const slug = generateSlug(name);

    // 2. Verificar que no exista otra subcategoría activa con el mismo slug bajo este padre
    const existing = await CategoryModel.findOne({
        slug,
        parentId: parent._id,
        isActive: true,
    });
    if (existing) {
        throw new Error(`Ya existe una subcategoría "${name}" en este nivel`);
    }

    // 3. Construir el path: path del padre + nuevo slug + coma
    const path = `${parent.path}${slug},`;

    // 4. Reactivar si existe una versión soft-deleted con el mismo slug bajo este padre
    const softDeleted = await CategoryModel.findOne({
        slug,
        parentId: parent._id,
        isActive: false,
    });
    if (softDeleted) {
        softDeleted.name = name;
        softDeleted.slug = slug;
        softDeleted.path = path;
        softDeleted.level = parent.level + 1;
        softDeleted.isActive = true;
        await softDeleted.save();
        return softDeleted;
    }

    // 5. Calcular el orden (ponerlo al final de sus hermanos)
    const siblingCount = await CategoryModel.countDocuments({
        parentId: parent._id,
        isActive: true,
    });

    return CategoryModel.create({
        name,
        slug,
        path,
        parentId: parent._id,
        level: parent.level + 1,
        order: siblingCount,
    });
}

// OBTENER hijos directos (un solo nivel)
// uso: dropdowns en cascada, menú de navegación
export async function getDirectChildren(
    parentId: string | null
) {
    return CategoryModel.find({
        parentId: parentId,
        isActive: true,
    }).sort({ order: 1 });
}

// ============================================
// OBTENER todos los descendientes
// Útil para: "dame todos los productos de Electrónica"
// ============================================
export async function getDescendants(categoryId: string) {
    const category = await CategoryModel.findById(categoryId);
    if (!category) return [];

    // El regex busca todo lo que empiece con el path del padre
    // Si category.path = ",electronica,"
    // Matchea: ",electronica,computadoras,", ",electronica,computadoras,notebooks,", etc.
    const escapedPath = escapeRegex(category.path);

    return CategoryModel.find({
        path: { $regex: `^${escapedPath}` },
        _id: { $ne: category._id },
        isActive: true,
    }).sort({ level: 1, order: 1 });
}

// OBTENER ancestros (breadcrumb)
// uso: Breadcrumbs: "Electrónica > Computadoras > Notebooks"
export async function getAncestors(categoryId: string) {
    const category = await CategoryModel.findById(categoryId);
    if (!category) return [];

    // Extraer todos los slugs del path (menos el último que es él mismo)
    // ",electronica,computadoras,notebooks," → ["electronica", "computadoras"]
    const slugs = category.path
        .split(",")
        .filter(Boolean)
        .slice(0, -1);

    if (slugs.length === 0) return [];

    return CategoryModel.find({
        slug: { $in: slugs },
        isActive: true,
    }).sort({ level: 1 });
}

// OBTENER árbol completo (para el frontend)
// Devuelve estructura anidada con children[]
export async function getCategoryTree() {
    // 1. Traer TODAS las categorías activas en una sola query
    const allCategories: ICategory[] = await CategoryModel.find({ isActive: true })
        .sort({ level: 1, order: 1 })
        .lean();  // .lean() devuelve objetos planos, más rápido

    // 2. Construir el árbol en memoria con un Map
    // Esto es O(n) — mucho más eficiente que hacer queries recursivas
    const map = new Map<string, any>();
    const roots: any[] = [];

    // Primer pasada: crear nodos con children vacío
    // _id y parentId se convierten explícitamente a string para que
    // NextResponse.json los serialice como strings planos y no como ObjectId
    for (const cat of allCategories) {
        const id = cat._id!.toString();
        map.set(id, {
            ...cat,
            _id: id,
            parentId: cat.parentId ? cat.parentId.toString() : null,
            children: [],
        });
    }

    // Segunda pasada: enganchar cada nodo a su padre
    for (const cat of allCategories) {
        const node = map.get(cat._id!.toString());
        if (cat.parentId) {
            const parent = map.get(cat.parentId.toString());
            if (parent) parent.children.push(node);
        } else {
            roots.push(node);  // sin padre = es raíz
        }
    }

    return roots;
}

// RENOMBRAR categoría
// Actualiza name, slug y el path de ella y todos sus descendientes
export async function renameCategory(categoryId: string, newName: string) {
    const category = await CategoryModel.findById(categoryId);
    if (!category) throw new Error("Categoría no encontrada");

    const newSlug = generateSlug(newName);
    const oldPath = category.path;

    // Reconstruir path reemplazando el slug al final:
    // ",electronica,computadoras," → ",electronica,computers,"
    const newPath =
        oldPath.slice(0, -(category.slug.length + 1)) + newSlug + ",";

    category.name = newName;
    category.slug = newSlug;
    category.path = newPath;
    await category.save();

    // Actualizar paths de todos los descendientes
    const descendants = await CategoryModel.find({
        path: { $regex: `^${escapeRegex(oldPath)}` },
        _id: { $ne: category._id },
    });

    if (descendants.length > 0) {
        const bulkOps = descendants.map((desc: { _id: any; path: string }) => ({
            updateOne: {
                filter: { _id: desc._id },
                update: { $set: { path: desc.path.replace(oldPath, newPath) } },
            },
        }));
        await CategoryModel.bulkWrite(bulkOps);
    }

    return category;
}

// MOVER categoría a otro padre
// (actualiza path de ella y todos sus descendientes)
export async function moveCategory(
    categoryId: string,
    newParentId: string | null
) {
    const category = await CategoryModel.findById(categoryId);
    if (!category) throw new Error("Categoría no encontrada");

    const oldPath = category.path;
    let newPath: string;
    let newLevel: number;

    if (newParentId) {
        const newParent = await CategoryModel.findById(newParentId);
        if (!newParent) throw new Error("Nuevo padre no encontrado");

        // Validar que no se mueva padre dentro de su propio hijo
        if (newParent.path.startsWith(category.path)) {
            throw new Error("No podés mover una categoría dentro de sí misma");
        }

        newPath = `${newParent.path}${category.slug},`;
        newLevel = newParent.level + 1;
        category.parentId = newParent._id;
    } else {
        newPath = `,${category.slug},`;
        newLevel = 0;
        category.parentId = null;
    }

    const levelDiff = newLevel - category.level;
    category.path = newPath;
    category.level = newLevel;
    await category.save();

    // Actualizar TODOS los descendientes con bulkWrite en una sola operacion
    const descendants = await CategoryModel.find({
        path: { $regex: `^${escapeRegex(oldPath)}` },
        _id: { $ne: category._id },
    });

    if (descendants.length > 0) {
        const bulkOps = descendants.map((desc: { _id: any; path: string; level: number; }) => ({
            updateOne: {
                filter: { _id: desc._id },
                update: {
                    $set: {
                        path: desc.path.replace(oldPath, newPath),
                        level: desc.level + levelDiff,
                    },
                },
            },
        }));
        await CategoryModel.bulkWrite(bulkOps);
    }

    return category;
}

// soft delete de categoría 
export async function deleteCategory(categoryId: string) {
    const category = await CategoryModel.findById(categoryId);
    if (!category) throw new Error("Categoría no encontrada");

    const escapedPath = escapeRegex(category.path);

    // Soft delete de la categoria y todos sus descendientes
    await CategoryModel.updateMany(
        { path: { $regex: `^${escapedPath}` } },
        { $set: { isActive: false } }
    );
}
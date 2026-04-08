"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IoMdAdd } from "react-icons/io";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { IProduct } from "@/interfaces/IProduct";
import { ProductTable } from "@/components/admin/dashboard/productList/ProductTable";
import { ProductDeleteDialog } from "@/components/admin/dashboard/productList/ProductDeleteDialog";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const ProductsPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [allProducts, setAllProducts] = useState<IProduct[]>([]);
  const [deletingProduct, setDeletingProduct] = useState<IProduct | null>(null);

  const getProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/products", { method: "GET", cache: "no-store" });
      if (!response.ok) throw new Error();
      const products = await response.json();
      setAllProducts(products);
    } catch {
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (values: Partial<IProduct>) => {
    setOpenDeleteDialog(false);
    setLoading(true);
    try {
      const response = await fetch(`/api/products/${values._id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      await getProducts();
      toast({ description: `¡Eliminaste el producto ${values.nombre}!` });
    } catch {
      toast({ description: "Error al eliminar producto.", variant: "destructive" });
    } finally {
      setLoading(false);
      setDeletingProduct(null);
    }
  };

  const handleEditProduct = (product: IProduct) => {
    router.push(`/admin/dashboard/products/${product._id}/edit`);
  };

  const handleDeleteClick = (product: IProduct) => {
    setDeletingProduct(product);
    setOpenDeleteDialog(true);
  };

  function handleSetOpenDeleteDialog() {
    setOpenDeleteDialog(false);
    setDeletingProduct(null);
  }

  function handleCopyPrice() {
    toast({ description: "Precio copiado al portapapeles" });
  }

  useEffect(() => {
    getProducts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className="flex items-start justify-between mb-4 md:mb-3 2xl:mb-6">
        <div className="flex flex-col gap-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink className="text-xs" asChild>
                  <Link href="/admin/dashboard/products">Inicio</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink className="text-xs" asChild>
                  <Link href="/admin/dashboard/products">Productos</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-xs">Todos los productos</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h2 className="text-2xl font-semibold md:text-2xl">Todos los productos</h2>
        </div>
        <Button
          variant="default"
          onClick={() => router.push("/admin/dashboard/products/new")}
          className="flex gap-2 p-2 my-auto w-fit h-fit"
        >
          <IoMdAdd size={18} className="w-fit h-fit" />
          <span className="hidden text-xs 2xl:text-sm sm:block">Crear producto</span>
        </Button>
      </div>

      {loading ? (
        <div
          className="flex items-center justify-center w-full overflow-y-hidden bg-background"
          style={{ zIndex: "99999999", height: "50vh" }}
        >
          <div className="loader" />
        </div>
      ) : (
        <ProductTable
          data={allProducts}
          onModifyPrices={() => getProducts()}
          onEdit={handleEditProduct}
          onDelete={handleDeleteClick}
          onCopyPrice={handleCopyPrice}
        />
      )}

      <ProductDeleteDialog
        open={openDeleteDialog}
        onOpenChange={handleSetOpenDeleteDialog}
        onSubmit={(values) => handleDeleteProduct(values)}
        deletingProduct={deletingProduct}
      />
    </>
  );
};

export default ProductsPage;

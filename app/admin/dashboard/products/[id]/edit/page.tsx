"use client";

import { useParams } from "next/navigation";
import EditProductForm from "@/components/admin/dashboard/products/edit/EditProductForm";

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;

  return <EditProductForm productId={productId} />;
}

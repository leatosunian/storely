"use client";

import { useState } from "react";
import Link from "next/link";
import { IoMdAdd } from "react-icons/io";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { CustomerTable } from "@/components/admin/dashboard/customers/CustomerTable";
import { CustomerFormDialog } from "@/components/admin/dashboard/customers/CustomerFormDialog";

export default function CustomersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreated = () => {
    setDialogOpen(false);
    setRefreshKey((k) => k + 1);   // dispara re-fetch en CustomerTable
  };

  return (
    <>
      <div className="flex items-start justify-between mb-4 md:mb-3 2xl:mb-6">
        <div className="flex flex-col gap-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink className="text-xs" asChild>
                  <Link href="/admin/dashboard">Inicio</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="text-xs">Ventas</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-xs">Clientes</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h2 className="text-2xl font-semibold md:text-2xl">Clientes</h2>
        </div>

        <Button
          variant="default"
          className="flex gap-2 p-2 my-auto w-fit h-fit"
          onClick={() => setDialogOpen(true)}
        >
          <IoMdAdd size={18} />
          <span className="hidden text-xs 2xl:text-sm sm:block">Nuevo cliente</span>
        </Button>
      </div>

      <CustomerTable refreshKey={refreshKey} />

      <CustomerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleCreated}
      />
    </>
  );
}

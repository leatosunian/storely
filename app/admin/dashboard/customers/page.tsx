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

export default function CustomersPage() {
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
              <BreadcrumbItem className="text-xs">
                Ventas
              </BreadcrumbItem>
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
        >
          <IoMdAdd size={18} className="w-fit h-fit" />
          <span className="hidden text-xs 2xl:text-sm sm:block">Nuevo cliente</span>
        </Button>
      </div>
      <CustomerTable />
    </>
  );
}

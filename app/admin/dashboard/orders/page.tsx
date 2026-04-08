import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { OrderTable } from "@/components/admin/dashboard/orders/OrderTable";

export default function OrdersPage() {
  return (
    <>
      <div className="flex items-start justify-between mb-4 md:mb-3 2xl:mb-6">
        <div className="flex flex-col gap-2 w-full">
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
                <BreadcrumbPage className="text-xs">Pedidos</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex justify-between w-full h-fit items-center">
            <h2 className="text-2xl font-semibold md:text-2xl">Pedidos</h2>
            <Link href="/admin/dashboard/orders/create">
              <Button>Crear pedido</Button>
            </Link>
          </div>
        </div>
      </div>
      <OrderTable />
    </>
  );
}

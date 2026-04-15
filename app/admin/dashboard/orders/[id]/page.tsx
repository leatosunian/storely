import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { orderService } from "@/services/orderService";
import OrderDetailView from "@/components/admin/dashboard/orders/order/OrderDetailView";

type Props = { params: Promise<{ id: string }> };

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;

  let order: Awaited<ReturnType<typeof orderService.findById>>;
  try {
    order = await orderService.findById(id);
  } catch {
    notFound();
  }

  // Serialize Mongoose document to plain object for the client component
  const serialized = JSON.parse(JSON.stringify(order));

  return (
    <>
      <div className="flex flex-col gap-2 mb-6">
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
              <BreadcrumbLink className="text-xs" asChild>
                <Link href="/admin/dashboard/orders">Pedidos</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-xs font-mono">
                {serialized.orderNumber}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <OrderDetailView order={serialized} />
    </>
  );
}

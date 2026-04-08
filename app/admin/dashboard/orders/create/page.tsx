import Link from "next/link";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { CreateOrderComp } from "@/components/admin/dashboard/orders/CreateOrderComp";

export default function CreateOrderPage() {
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
                            <BreadcrumbItem>
                                <BreadcrumbLink className="text-xs" asChild>
                                    <Link href="/admin/dashboard/orders">Pedidos</Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage className="text-xs">Crear pedido</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="flex justify-between w-full h-fit items-center">
                        <h2 className="text-2xl font-semibold md:text-2xl">Crear pedido</h2>
                    </div>
                </div>
            </div>

            <CreateOrderComp />
        </>
    );
}

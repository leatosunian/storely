import { notFound }     from "next/navigation";
import Link              from "next/link";
import connectDB         from "@/lib/db/db";
import { CustomerModel } from "@/lib/db/models/customer";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { CustomerProfileClient } from "@/components/admin/dashboard/customers/customer/CustomerProfileClient";
import { ICustomer } from "@/interfaces/ICustomer";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  await connectDB();

  const customer: ICustomer | null = await CustomerModel.findById(id).lean();
  if (!customer) notFound();

  // Serializar para pasar como prop al Client Component
  const serialized = JSON.parse(JSON.stringify(customer));

  return (
    <>
      <div className="mb-4 md:mb-5">
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
                <Link href="/admin/dashboard/customers">Clientes</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-xs">
                {customer.firstName} {customer.lastName}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <CustomerProfileClient customer={serialized} />
    </>
  );
}

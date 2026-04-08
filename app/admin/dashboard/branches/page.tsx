"use client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { IoMdAdd } from "react-icons/io";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import BranchesChart from "@/components/admin/dashboard/branches/BranchesChart";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formSchema } from "@/app/schemas/createBranchForm";
import { useToast } from "@/hooks/use-toast";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import Link from "next/link";

const BranchesPage = () => {
  const formCreate = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      branchCode: "",
      branchName: "",
      address: "",
      city: "",
      state: "",
      phone: "",
      email: "",
    },
  });
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [openCreateDialog, setOpenCreateDialog] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState(0);

  async function onSubmit(values: any) {
    setIsSubmitting(true);
    setOpenCreateDialog(false);
    setLoading(true);
    try {
      await fetch("/api/branches", {
        method: "POST",
        body: JSON.stringify(values),
      }).then((response) => response.json());
      setLoading(false);
      setIsSubmitting(false);
      setRefreshKey((k) => k + 1);
      formCreate.reset();
      toast({ description: "¡Nueva sucursal creada!", variant: "default" });
    } catch (error) {
      setLoading(false);
      setIsSubmitting(false);
      toast({ description: "Error al crear sucursal", variant: "destructive" });
    }
  }

  return (
    <>
      {/* create branch modal */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <Form {...formCreate}>
            <form onSubmit={formCreate.handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>Crear sucursal</DialogTitle>
                <DialogDescription>
                  Ingresá los datos de tu nueva sucursal.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="w-full h-fit">
                  <FormField
                    control={formCreate.control}
                    name="branchCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-right">Código de sucursal</FormLabel>
                        <FormControl>
                          <Input type="text" id="branchCode" placeholder="SUC01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="w-full h-fit">
                  <FormField
                    control={formCreate.control}
                    name="branchName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-right">Nombre de sucursal</FormLabel>
                        <FormControl>
                          <Input type="text" id="branchName" placeholder="Sucursal 1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="w-full h-fit">
                  <FormField
                    control={formCreate.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-right">Domicilio de sucursal</FormLabel>
                        <FormControl>
                          <Input id="address" type="text" placeholder="Juan B. Justo 2040" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="w-full h-fit">
                  <FormField
                    control={formCreate.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-right">Ciudad</FormLabel>
                        <FormControl>
                          <Input id="city" type="text" placeholder="Mar del Plata" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="w-full h-fit">
                  <FormField
                    control={formCreate.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-right">Provincia</FormLabel>
                        <FormControl>
                          <Input id="state" type="text" placeholder="Buenos Aires" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="w-full h-fit">
                  <FormField
                    control={formCreate.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-right">Teléfono</FormLabel>
                        <FormControl>
                          <Input id="phone" type="text" placeholder="0223 000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="w-full h-fit">
                  <FormField
                    control={formCreate.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-right">Email</FormLabel>
                        <FormControl>
                          <Input id="email" type="email" placeholder="sucursal@ejemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="animate-spin" size={16} />}
                  Crear sucursal
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* header  */}
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
              Administración
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-xs">Sucursales</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex justify-between w-full h-fit items-center">

          <h2 className="text-2xl font-medium">Sucursales</h2>
          <Button onClick={() => setOpenCreateDialog(true)} variant="outline" className="p-2 w-fit h-fit">
            <IoMdAdd size={20} className="w-fit h-fit" />
          </Button>
        </div>
      </div>

      <Separator className="my-4" />

      {/* branches chart */}
      <div>
        <div className="grid gap-0">
          {loading && (
            <div
              className="flex items-center justify-center w-full overflow-y-hidden bg-background"
              style={{ zIndex: "99999999", height: "50vh" }}
            >
              <div className="loader"></div>
            </div>
          )}
          {!loading && <BranchesChart key={refreshKey} />}
        </div>
      </div>
    </>
  );
};

export default BranchesPage;

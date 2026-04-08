"use client";
import EmployeesChart from "@/components/admin/dashboard/employees/EmployeesChart";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TiUserAdd } from "react-icons/ti";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formSchema } from "@/app/schemas/createEmployeeForm";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { IAdmin } from "@/lib/db/models/admin";
import { IBranch } from "@/lib/db/models/branch";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import Link from "next/link";

const EmployeesPage = () => {
  const formCreate = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      surname: "",
      phone: "",
      email: "",
      password: "",
      username: "",
      department: "",
      branchId: "",
      isActive: true,
    },
  });
  const { toast } = useToast();
  const [openCreateDialog, setOpenCreateDialog] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employees, setEmployees] = useState<IAdmin[]>([]);
  const [branches, setBranches] = useState<IBranch[]>([]);

  async function getEmployees() {
    try {
      const employeesFetch = await fetch("/api/employees", {
        method: "GET",
        cache: "no-store",
      }).then((response) => response.json());
      setEmployees(employeesFetch.employees);
      setLoading(false);
    } catch (error) { }
  }

  async function getBranches() {
    try {
      const branchesFetch = await fetch("/api/branches", {
        method: "GET",
        cache: "no-store",
      }).then((response) => response.json());
      setBranches(branchesFetch.branches);
    } catch (error) { }
  }

  async function onSubmit(values: any) {
    values.uuid = uuidv4();
    values.isActive = true;
    if (!values.branchId) delete values.branchId;
    setIsSubmitting(true);
    setOpenCreateDialog(false);
    setLoading(true);
    try {
      await fetch("/api/employees", {
        method: "POST",
        body: JSON.stringify(values),
      }).then((response) => response.json());
      getEmployees();
      setLoading(false);
      setIsSubmitting(false);
      toast({ description: "¡Nuevo empleado creado!", variant: "default" });
    } catch (error) {
      setLoading(false);
      setIsSubmitting(false);
      toast({ description: "Error al crear empleado", variant: "destructive" });
    }
  }

  useEffect(() => {
    getEmployees();
    getBranches();
  }, []);

  return (
    <>
      {/* create employee modal */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <Form {...formCreate}>
            <form onSubmit={formCreate.handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>Crear empleado</DialogTitle>
                <DialogDescription>
                  Ingresá los datos de tu nuevo empleado.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="w-full h-fit">
                  <FormField
                    control={formCreate.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-right">Nombre</FormLabel>
                        <FormControl>
                          <Input type="text" id="name" placeholder="Pedro" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="w-full h-fit">
                  <FormField
                    control={formCreate.control}
                    name="surname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-right">Apellido</FormLabel>
                        <FormControl>
                          <Input type="text" id="surname" placeholder="Lopez" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="w-full h-fit">
                  <FormField
                    control={formCreate.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-right">Nombre de usuario</FormLabel>
                        <FormControl>
                          <Input type="text" id="username" placeholder="pedrolopez12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="w-full h-fit">
                  <FormField
                    control={formCreate.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-right">Contraseña</FormLabel>
                        <FormControl>
                          <Input type="password" id="password" placeholder="*********" {...field} />
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
                          <Input type="number" id="phone" placeholder="2235423025" {...field} />
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
                          <Input type="email" id="email" placeholder="pedrolopez@gmail.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="w-full h-fit">
                  <FormField
                    control={formCreate.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-right">Área</FormLabel>
                        <FormControl>
                          <Input type="text" id="department" placeholder="Ventas" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="w-full h-fit">
                  <FormField
                    control={formCreate.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de usuario</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="EMPLOYEE">Vendedor</SelectItem>
                            <SelectItem value="ADMIN">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="w-full h-fit">
                  <FormField
                    control={formCreate.control}
                    name="branchId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sucursal</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sin sucursal" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {branches.map((branch) => (
                              <SelectItem key={branch._id} value={branch._id!}>
                                {branch.branchName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="animate-spin" size={16} />}
                  Crear empleado
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      {/* header */}
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
              <BreadcrumbPage className="text-xs">Empleados</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex justify-between w-full h-fit items-center">
          <h2 className="text-2xl font-medium">Mis empleados</h2>
          <Button
            onClick={() => setOpenCreateDialog(true)}
            variant="outline"
            className="p-2 w-fit h-fit"
          >
            <TiUserAdd size={20} className="w-fit h-fit" />
          </Button>
        </div>
      </div>

      <Separator className="my-4" />
      
      {/* employees chart */}
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
          {!loading && <EmployeesChart employeesFetch={employees} branches={branches} onCreated={() => getEmployees()} />}
        </div>
      </div>
    </>
  );
};

export default EmployeesPage;

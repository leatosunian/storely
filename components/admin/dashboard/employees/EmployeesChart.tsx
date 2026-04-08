"use client";
import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IoMdMore } from "react-icons/io";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formSchema } from "@/app/schemas/editEmployeeForm";
import { useToast } from "@/hooks/use-toast";
import { IAdmin } from "@/lib/db/models/admin";
import { IBranch } from "@/lib/db/models/branch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useSession } from "next-auth/react";

interface props {
  onCreated: () => void;
  employeesFetch: IAdmin[];
  branches: IBranch[];
}

const EmployeesChart = ({ onCreated, employeesFetch, branches }: props) => {
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<IAdmin>();
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employees, setEmployees] = useState<IAdmin[]>([]);
  const { data: session }: any = useSession();
  const modalButtonRef = useRef<HTMLButtonElement>(null);
  const handleClick = () => {
    modalButtonRef.current?.click();
  };
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      surname: "",
      phone: "",
      email: "",
      password: "",
      role: "",
      department: "",
      branchId: "",
      isActive: true,
    },
  });

  async function onSubmit(values: any) {
    setIsSubmitting(true);
    setLoading(true);
    setOpenEditDialog(false);
    values._id = employeeToEdit?._id;
    if (values.password === "") delete values.password;
    if (!values.branchId) delete values.branchId;
    try {
      await fetch("/api/employees", {
        method: "PUT",
        body: JSON.stringify(values),
      }).then((response) => response.json());
      onCreated();
      setOpenEditDialog(false);
      setLoading(false);
      toast({ description: "¡Empleado editado!", variant: "default" });
    } catch (error) {
      setOpenEditDialog(false);
      setLoading(false);
      toast({
        description: "Error al editar empleado",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    setEmployees(employeesFetch);
    setLoading(false);
  }, [employeesFetch]);

  async function onDelete() {
    setIsSubmitting(true);
    setLoading(true);
    setOpenEditDialog(false);
    try {
      await fetch("/api/employees", {
        method: "DELETE",
        body: JSON.stringify(employeeToEdit?._id),
      });
      toast({ description: "¡Empleado eliminado!", variant: "default" });
      onCreated();
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast({
        description: "Error al eliminar empleado",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    form.setValue("name", employeeToEdit?.name ?? "");
    form.setValue("surname", employeeToEdit?.surname ?? "");
    form.setValue("phone", employeeToEdit?.phone ?? "");
    form.setValue("email", employeeToEdit?.email ?? "");
    form.setValue("password", "");
    form.setValue("role", employeeToEdit?.role ?? "");
    form.setValue("department", employeeToEdit?.department ?? "");
    form.setValue("branchId", employeeToEdit?.branchId?.toString() ?? "");
    form.setValue("isActive", employeeToEdit?.isActive ?? true);
  }, [employeeToEdit]);

  const getBranchName = (branchId?: any) => {
    if (!branchId) return null;
    const branch = branches.find((b) => b._id === branchId?.toString());
    return branch?.branchName ?? null;
  };

  return (
    <>
      {loading && (
        <div
          className="flex items-center justify-center w-full overflow-y-hidden bg-background"
          style={{ zIndex: "99999999", height: "50vh" }}
        >
          <div className="loader"></div>
        </div>
      )}

      {!loading && (
        <>
          <div className="border rounded-md">
          <Table>
            <TableCaption>Listado de empleados.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Nombre y apellido</TableHead>
                <TableHead className="hidden sm:table-cell">Usuario</TableHead>
                <TableHead>Área</TableHead>
                <TableHead className="hidden md:table-cell">Sucursal</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="hidden lg:table-cell">Email</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees &&
                employees.map((employee) => (
                  <TableRow
                    key={employee._id}
                    className="cursor-pointer"
                    onClick={() => {
                      setEmployeeToEdit(employee);
                      setOpenEditDialog(true);
                    }}>
                    <TableCell className="font-medium">
                      {employee.name} {employee.surname}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground font-mono text-sm">
                      {employee.username}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {employee.department || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {getBranchName(employee.branchId) || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {employee.role === "ADMIN" ? "Administrador" : "Vendedor"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {employee.email}
                    </TableCell>
                    <TableCell>
                      <span className={employee.isActive ? "text-green-500" : "text-muted-foreground"}>
                        {employee.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          </div>

          <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <DialogHeader>
                    <DialogTitle>Editar empleado</DialogTitle>
                    <DialogDescription>
                      Modificá los datos de tu empleado.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="w-full h-fit">
                      <FormField
                        control={form.control}
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
                        control={form.control}
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
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-right">Telefono</FormLabel>
                            <FormControl>
                              <Input type="number" id="telefono" placeholder="2235423025" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="w-full h-fit">
                      <FormField
                        control={form.control}
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
                        control={form.control}
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
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-right">Cambiar contraseña</FormLabel>
                            <FormControl>
                              <Input type="password" id="password" placeholder="*********" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {session?.user &&
                      session?.user.username !== employeeToEdit?.username && (
                        <div className="w-full h-fit">
                          <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tipo de usuario</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  {...field}
                                >
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
                      )}
                    <div className="w-full h-fit">
                      <FormField
                        control={form.control}
                        name="branchId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sucursal</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? ""}>
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
                    <div className="w-full h-fit">
                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <FormLabel>Cuenta activa</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <DialogFooter className="gap-6 mt-4">
                    {session?.user.username &&
                      session?.user.username !== employeeToEdit?.username && (
                        <Button
                          onClick={handleClick}
                          type="button"
                          variant={"destructive"}
                          disabled={isSubmitting}
                        >
                          {isSubmitting && <Loader2 className="animate-spin" size={16} />}
                          Eliminar empleado
                        </Button>
                      )}
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="animate-spin" size={16} />}
                      Guardar cambios
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <div className="px-10 rounded-md">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="sr-only" ref={modalButtonRef} variant="outline">
                  Show Dialog
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminar empleado</AlertDialogTitle>
                  <AlertDialogDescription>
                    Estás seguro que querés eliminar al empleado{" "}
                    {employeeToEdit?.name} {employeeToEdit?.surname}?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="text-white bg-red-900"
                    onClick={onDelete}
                  >
                    Continuar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </>
      )}
    </>
  );
};

export default EmployeesChart;

"use client";
import React, { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Phone, Mail, Hash } from "lucide-react";
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
import { IBranch } from "@/lib/db/models/branch";
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

const BranchesChart = () => {
  const form = useForm<z.infer<typeof formSchema>>({
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
  const [branchToEdit, setBranchToEdit] = useState<IBranch>();
  const [branches, setBranches] = useState<IBranch[]>([]);
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalButtonRef = useRef<HTMLButtonElement>(null);
  const handleClick = () => {
    modalButtonRef.current?.click();
    setOpenEditDialog(false);
  };
  const { toast } = useToast();

  async function getBranches() {
    try {
      const branchesFetch = await fetch("/api/branches", {
        method: "GET",
        cache: "no-store",
      }).then((response) => response.json());
      setBranches(branchesFetch.branches);
      setLoading(false);
    } catch (error) { }
  }

  async function onDelete() {
    setIsSubmitting(true);
    setLoading(true);
    setOpenEditDialog(false);
    try {
      await fetch("/api/branches", {
        method: "DELETE",
        body: JSON.stringify(branchToEdit?._id),
      });
      toast({ description: "Sucursal eliminada", variant: "default" });
      getBranches();
    } catch (error) {
      setLoading(false);
      toast({
        description: "Error al eliminar sucursal",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onSubmit(values: any) {
    setIsSubmitting(true);
    setLoading(true);
    values._id = branchToEdit?._id;
    try {
      await fetch("/api/branches", {
        method: "PUT",
        body: JSON.stringify(values),
      }).then((response) => response.json());
      getBranches();
      setOpenEditDialog(false);
      setLoading(false);
      toast({ description: "¡Sucursal editada!", variant: "default" });
    } catch (error) {
      setOpenEditDialog(false);
      toast({
        description: "Error al editar sucursal",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    getBranches();
  }, []);

  useEffect(() => {
    form.setValue("branchCode", branchToEdit?.branchCode ?? "");
    form.setValue("branchName", branchToEdit?.branchName!);
    form.setValue("address", branchToEdit?.address!);
    form.setValue("city", branchToEdit?.city!);
    form.setValue("state", branchToEdit?.state!);
    form.setValue("phone", branchToEdit?.phone ?? "");
    form.setValue("email", branchToEdit?.email ?? "");
  }, [branchToEdit]);

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {branches &&
              branches.map((branch) => (
                <div
                  key={branch._id}
                  onClick={() => {
                    setBranchToEdit(branch);
                    setOpenEditDialog(true);
                  }}
                  className="group cursor-pointer rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-card-foreground">
                        {branch.branchName}
                      </h3>
                      <span className="inline-block mt-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                        {branch.branchCode || "Sin código"}
                      </span>
                    </div>
                    <div className="rounded-lg bg-secondary p-2 text-muted-foreground group-hover:text-primary transition-colors">
                      <Hash size={16} />
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin size={14} className="shrink-0 text-primary/70" />
                      <span className="truncate">
                        {branch.address}
                        {branch.city ? `, ${branch.city}` : ""}
                        {branch.state ? `, ${branch.state}` : ""}
                      </span>
                    </div>

                    {branch.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone size={14} className="shrink-0 text-primary/70" />
                        <span>{branch.phone}</span>
                      </div>
                    )}

                    {branch.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail size={14} className="shrink-0 text-primary/70" />
                        <span className="truncate">{branch.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>

          <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
            <DialogContent className="sm:max-w-[425px] z-[100]">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <DialogHeader>
                    <DialogTitle>Editar sucursal</DialogTitle>
                    <DialogDescription>
                      Modificá los datos de tu sucursal.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="w-full h-fit">
                      <FormField
                        control={form.control}
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
                        control={form.control}
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
                        control={form.control}
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
                        control={form.control}
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
                        control={form.control}
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
                        control={form.control}
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
                        control={form.control}
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
                  <DialogFooter className="gap-6 mt-4">
                    <Button onClick={handleClick} type="button" variant={"destructive"} disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="animate-spin" size={16} />}
                      Eliminar sucursal
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="animate-spin" size={16} />}
                      Guardar cambios
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </>
      )}

      <div className="px-10 rounded-md z-[110]">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="sr-only" ref={modalButtonRef} variant="outline">
              Show Dialog
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar sucursal</AlertDialogTitle>
              <AlertDialogDescription>
                Estás seguro que querés eliminar la sucursal {branchToEdit?.branchName}?
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
  );
};

export default BranchesChart;

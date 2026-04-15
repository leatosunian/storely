"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, UserPlus, ArrowLeft, Loader2, Users, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { TAX_TYPE_LABELS } from "@/interfaces/ICustomer";

export interface CustomerOption {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  taxType?: string;
  totalOrders?: number;
  totalSpent?: number;
  address?: {
    street: string;
    city: string;
    province: string;
    postalCode?: string;
    country: string;
  };
}

interface CustomerPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (customer: CustomerOption) => void;
  selectedCustomerId?: string;
}

const QuickCreateSchema = z.object({
  firstName: z.string().min(1, "Nombre requerido"),
  lastName: z.string().min(1, "Apellido requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  taxType: z.enum(["consumidor_final", "responsable_inscripto", "monotributista", "exento"]),
});

type QuickCreateDTO = z.infer<typeof QuickCreateSchema>;

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export default function CustomerPickerModal({
  open,
  onOpenChange,
  onSelect,
  selectedCustomerId,
}: CustomerPickerModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<"list" | "create">("list");
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const createForm = useForm<QuickCreateDTO>({
    resolver: zodResolver(QuickCreateSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      taxType: "consumidor_final",
    },
  });

  // Load / search customers whenever open or search changes
  useEffect(() => {
    if (!open || step !== "list") return;
    const timeout = setTimeout(
      () => {
        setLoading(true);
        const params = new URLSearchParams({ limit: "50", sortBy: "lastName", sortOrder: "asc" });
        if (search.trim()) params.set("search", search.trim());
        fetch(`/api/customers?${params}`)
          .then((r) => r.json())
          .then((data) => setCustomers(data.data ?? []))
          .finally(() => setLoading(false));
      },
      search.trim() ? 350 : 0
    );
    return () => clearTimeout(timeout);
  }, [open, search, step]);

  function handleSelect(customer: CustomerOption) {
    onSelect(customer);
    closeAndReset();
  }

  async function handleCreate(data: QuickCreateDTO) {
    setIsCreating(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, tags: [], status: "active", creditLimit: 0 }),
      });
      const json = await res.json();
      if (json.success) {
        toast({
          title: "Cliente creado",
          description: `${data.firstName} ${data.lastName} agregado correctamente.`,
        });
        onSelect({
          _id: json.data._id,
          firstName: json.data.firstName,
          lastName: json.data.lastName,
          email: json.data.email,
          phone: json.data.phone,
          taxType: json.data.taxType,
          totalOrders: 0,
          totalSpent: 0,
          address: json.data.address,
        });
        closeAndReset();
      } else {
        toast({
          title: "Error",
          description: json.message ?? "No se pudo crear el cliente.",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Error", description: "Error de conexión.", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  }

  function closeAndReset() {
    onOpenChange(false);
    setTimeout(() => {
      setStep("list");
      setSearch("");
      createForm.reset();
    }, 200);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) closeAndReset();
    else onOpenChange(true);
  }

  function goToCreate() {
    setStep("create");
  }

  function goToList() {
    setStep("list");
    createForm.reset();
  }

  // ── List ─────────────────────────────────────────────────────────────────────
  const listContent = (
    <>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            autoFocus
            placeholder="Buscar por nombre, email o teléfono..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-shrink-0 gap-1.5"
          onClick={goToCreate}
        >
          <UserPlus className="h-4 w-4" />
          Nuevo
        </Button>
      </div>

      <div className="overflow-y-auto max-h-[420px] space-y-1 pr-1 -mr-1">
        {loading ? (
          <div className="flex items-center justify-center py-14 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span className="text-sm">Buscando...</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
            <Users className="h-10 w-10 mb-3 opacity-25" />
            <p className="text-sm">No se encontraron clientes</p>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="mt-2 h-auto p-0 text-xs gap-1"
              onClick={goToCreate}
            >
              <UserPlus className="h-3 w-3" />
              Crear nuevo cliente
            </Button>
          </div>
        ) : (
          customers.map((customer) => {
            const isSelected = customer._id === selectedCustomerId;
            const initials = getInitials(customer.firstName, customer.lastName);
            const taxLabel = customer.taxType
              ? TAX_TYPE_LABELS[customer.taxType as keyof typeof TAX_TYPE_LABELS]
              : null;

            return (
              <button
                key={customer._id}
                type="button"
                onClick={() => handleSelect(customer)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isSelected
                    ? "bg-primary/10 border border-primary/30"
                    : "border border-transparent"
                }`}
              >
                {/* Initials avatar */}
                <div
                  className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      {customer.firstName} {customer.lastName}
                    </p>
                    {taxLabel && (
                      <Badge variant="secondary" className="text-xs py-0 px-1.5 h-4 flex-shrink-0">
                        {taxLabel}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                    <span className="text-xs text-muted-foreground truncate">{customer.email}</span>
                    {customer.phone && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        · {customer.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats + check */}
                <div className="flex-shrink-0 flex items-center gap-2 pl-2">
                  {(customer.totalOrders != null || customer.totalSpent != null) && (
                    <div className="text-right">
                      {customer.totalOrders != null && (
                        <p className="text-xs text-muted-foreground">
                          {customer.totalOrders} pedido{customer.totalOrders !== 1 ? "s" : ""}
                        </p>
                      )}
                      {customer.totalSpent != null && customer.totalSpent > 0 && (
                        <p className="text-xs font-medium tabular-nums">
                          ${customer.totalSpent.toLocaleString("es-AR")}
                        </p>
                      )}
                    </div>
                  )}
                  {isSelected ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <div className="h-4 w-4" />
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </>
  );

  // ── Create ───────────────────────────────────────────────────────────────────
  const createContent = (
    <>
      <div className="flex items-center gap-2 -mt-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={goToList}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <p className="text-sm font-medium">Nuevo cliente</p>
          <p className="text-xs text-muted-foreground">
            Se guardará en la base de clientes
          </p>
        </div>
      </div>

      <Form {...createForm}>
        <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={createForm.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input autoFocus placeholder="Juan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={createForm.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellido</FormLabel>
                  <FormControl>
                    <Input placeholder="García" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={createForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="juan@ejemplo.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={createForm.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Teléfono{" "}
                    <span className="text-muted-foreground font-normal">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="+54 11 1234-5678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={createForm.control}
              name="taxType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condición IVA</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="consumidor_final">Consumidor Final</SelectItem>
                      <SelectItem value="responsable_inscripto">Resp. Inscripto</SelectItem>
                      <SelectItem value="monotributista">Monotributista</SelectItem>
                      <SelectItem value="exento">Exento</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={goToList}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isCreating}>
              {isCreating && <Loader2 className="animate-spin h-4 w-4 mr-1.5" />}
              Guardar cliente
            </Button>
          </div>
        </form>
      </Form>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>
            {step === "list" ? "Seleccionar cliente" : "Nuevo cliente"}
          </DialogTitle>
        </DialogHeader>

        {step === "list" ? listContent : createContent}
      </DialogContent>
    </Dialog>
  );
}

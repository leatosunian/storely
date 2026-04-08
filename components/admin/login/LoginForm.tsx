"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import LoaderFullscreen from "../LoaderFullscreen";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Card } from "@/components/ui/card";
import { Separator } from "@radix-ui/react-dropdown-menu";

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Ingresa un usuario válido.",
  }),
  password: z.string().min(4, {
    message: "Ingresa una contraseña válida.",
  }),
});

const LoginForm = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const login = await signIn("credentials", {
        username: values.username,
        password: values.password,
        redirect: false,
      });
      if (login?.ok) {
        router.push("/admin/dashboard/products");
      } else {
        setLoading(false);
        toast({
          description: "Usuario o contraseña incorrectos",
          variant: "destructive",
        });
      }
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  }
  return (
    <>
      {loading && (
        <>
          <div style={{ zIndex: '999999999999999999999' }} className="absolute top-0 left-0 w-screen h-screen overflow-hidden">
            <LoaderFullscreen />
          </div>
        </>
      )}
      {!loading && (
        <Card className="flex flex-col justify-between gap-8 mx-5 bg-transparent p-7 w-fit h-fit dark backdrop-blur-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col ">
              <span className="text-3xl font-semibold text-left ">
                Iniciar sesión
              </span>
              <Separator className="w-7" style={{backgroundColor:'#E8920A', height:'1px'}} />
            </div>
            <span className="text-sm font-normal text-left ">
              Ingresá tu usuario y contraseña para acceder.
            </span>

          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de usuario</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ingresa tu usuario"
                          type="text"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ingresa tu contraseña"
                          type="password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full ">
                Iniciar sesión
              </Button>
            </form>
          </Form>
        </Card>
      )}

      <Toaster />
    </>
  );
};

export default LoginForm;

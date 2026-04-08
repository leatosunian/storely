"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { RxCross2, RxHamburgerMenu } from "react-icons/rx";
import { usePathname } from "next/navigation";
import { CircleUserRound, Moon, Sun, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import { FaListCheck } from "react-icons/fa6";
import { TbShoppingCartSearch } from "react-icons/tb";
import { TiUserAdd } from "react-icons/ti";
import { MdBusiness } from "react-icons/md";
import logo from "@/public/logo.png";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  activePathname?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
  adminOnly?: boolean;
}

const navSections: NavSection[] = [
  {
    title: "Productos",
    items: [
      {
        href: "/admin/dashboard/products",
        label: "Todos los productos",
        icon: <TbShoppingCartSearch size={19} />,
      },
      {
        href: "/admin/dashboard/settings/categories",
        label: "Categorías",
        icon: <TbShoppingCartSearch size={19} />,
        activePathname: "/admin/dashboard/settings/categories",
      },
    ],
  },
  {
    title: "Ventas",
    items: [
      {
        href: "/admin/dashboard/orders",
        label: "Pedidos",
        icon: <FaListCheck size={16} />,
      },
      {
        href: "/admin/dashboard/customers",
        label: "Clientes",
        icon: <TiUserAdd size={18} />,
      },
    ],
  },
  {
    title: "Administración",
    adminOnly: true,
    items: [
      {
        href: "/admin/dashboard/employees",
        label: "Empleados",
        icon: <TiUserAdd size={18} />,
      },
      {
        href: "/admin/dashboard/branches",
        label: "Sucursales",
        icon: <MdBusiness size={18} />,
      },
    ],
  },
];

function NavLink({
  href,
  label,
  icon,
  isActive,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`${
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-foreground dark:bg-background hover:bg-primary/90 hover:text-white dark:hover:text-primary"
      } flex items-center p-2 text-base font-normal rounded-lg  transition-all duration-200 ease-in-out group`}
    >
      {icon}
      <span className="ml-2 text-sm">{label}</span>
    </Link>
  );
}

function ThemeToggleDropdown() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          style={{ width: "30px", height: "30px" }}
          className="my-auto"
          variant="outline"
          size="icon"
        >
          <Sun className="h-[0.9rem] w-[0.9rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[0.9rem] w-[0.9rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent style={{ zIndex: "9999999999" }} align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Modo claro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Modo oscuro
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserDropdown({
  name,
  showName,
}: {
  name: string;
  showName?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <CircleUserRound size={30} strokeWidth={1} className="cursor-pointer" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          style={{ zIndex: "9999999999" }}
          className="w-52"
        >
          <DropdownMenuLabel>{name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOut className="w-4 h-4 mr-2" />
            <span>Cerrar sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {showName && <span className="text-xs">{name}</span>}
    </div>
  );
}

// ─── Desktop Sidebar ────────────────────────────────────────────────────────

function DesktopSidebar({
  pathname,
  session,
}: {
  pathname: string;
  session: any;
}) {
  const userName = `${session?.user?.name ?? ""} ${session?.user?.surname ?? ""}`.trim();

  return (
    <aside
      id="sidebar"
      className="fixed top-0 left-0 z-20 flex-col flex-shrink-0 hidden w-56 h-full pt-0 duration-75 lg:flex transition-width"
      aria-label="Sidebar"
    >
      <div className="relative flex flex-col flex-1 min-h-0 pt-0 bg-background border-border borderR">
        <div className="flex items-center justify-center w-full py-6 border-bottom">
          <Image className="w-28" src={logo} alt="Logo" />
        </div>

        <Separator style={{ margin: "auto", width: "90%" }} className="mx-auto" />

        <div className="flex flex-col flex-1 pt-2 pb-4 overflow-y-auto">
          <div className="flex-1 px-3 space-y-1 bg-background divide-y">
            <ul className="pb-2 mt-1 space-y-1">
              {navSections.map((section, idx) => {
                if (section.adminOnly && session?.user?.role !== "ADMIN") return null;
                return (
                  <React.Fragment key={section.title}>
                    {idx > 0 && (
                      <Separator style={{ margin: "10px 0" }} className="h-0" />
                    )}
                    <span className="ml-2 text-xs font-semibold text-muted-foreground">
                      {section.title}
                    </span>
                    {section.items.map((item) => (
                      <li key={item.href + item.label}>
                        <NavLink
                          href={item.href}
                          label={item.label}
                          icon={item.icon}
                          isActive={pathname === (item.activePathname ?? item.href)}
                        />
                      </li>
                    ))}
                  </React.Fragment>
                );
              })}
            </ul>
          </div>
        </div>

        <div style={{ zIndex: "9999999" }} className="hidden mx-3 my-4 md:flex">
          <div className="flex items-center justify-center w-full gap-3">
            <UserDropdown name={userName} showName />
            <div className="hidden md:block w-fit h-fit">
              <ThemeToggleDropdown />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── Mobile Navbar ──────────────────────────────────────────────────────────

function MobileNavbar({
  pathname,
  session,
}: {
  pathname: string;
  session: any;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const userName = `${session?.user?.name ?? ""} ${session?.user?.surname ?? ""}`.trim();

  return (
    <nav
      style={{ zIndex: "1000000" }}
      className="fixed top-0 left-0 w-full bg-background border-b z-50 border-border block lg:hidden px-4"
    >
      <div className="flex items-center justify-between h-16">
        <Link href="/admin/dashboard/products" onClick={() => setIsOpen(false)}>
          <div className="flex items-center w-fit">
            <Image className="w-20" src={logo} alt="Logo" />
          </div>
        </Link>

        {/* Desktop-sized controls (md–lg range) */}
        <div className="hidden md:flex items-center gap-3" style={{ zIndex: "9999999" }}>
          <ThemeToggleDropdown />
          <UserDropdown name={userName} />
        </div>

        {/* Hamburger button (< md) */}
        <div className="md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center justify-center p-2 rounded-md"
          >
            <span className="sr-only">Open main menu</span>
            {isOpen ? (
              <RxCross2 size={28} className="text-foreground" />
            ) : (
              <RxHamburgerMenu size={25} className="block w-6 h-6 text-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile slide-out menu */}
      <div
        style={{ transform: "translateY(63px)", zIndex: "9999999" }}
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ease-in-out ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-black bg-opacity-65"
          onClick={() => setIsOpen(false)}
        />

        <div
          className={`absolute top-0 pt-2 right-0 w-64 h-full bg-background border-b border-border shadow-lg transform transition-transform duration-300 pb-4 ease-in-out flex flex-col justify-between ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
          style={{ height: "calc(100vh - 62px)" }}
        >
          <div className="px-2 pt-2 pb-3 space-y-4 sm:px-3">
            {navSections.map((section) => {
              if (section.adminOnly && session?.user?.role !== "ADMIN") return null;
              return (
                <div key={section.title} className="flex flex-col gap-2">
                  <span className="ml-2 text-xs font-semibold text-muted-foreground">
                    {section.title}
                  </span>
                  {section.items.map((item) => (
                    <NavLink
                      key={item.href + item.label}
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      isActive={pathname === (item.activePathname ?? item.href)}
                      onClick={() => setIsOpen(false)}
                    />
                  ))}
                </div>
              );
            })}
            <div className="flex flex-col gap-2">
              <span className="ml-2 text-xs font-semibold text-muted-foreground">Mi cuenta</span>
              <div
                className="flex items-center gap-1 px-3 py-3 text-sm font-medium transition-colors duration-300 rounded-md cursor-pointer"
                onClick={() => {
                  setIsOpen(false);
                  signOut();
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span>Cerrar sesión</span>
              </div>
            </div>
          </div>

          <div className="w-full px-4 h-fit">
            <Select onValueChange={setTheme} value={theme}>
              <SelectTrigger>
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <SelectValue placeholder="Tema" />
              </SelectTrigger>
              <SelectContent style={{ zIndex: "9999999" }} position="popper">
                <SelectItem value="light">Tema claro</SelectItem>
                <SelectItem value="dark">Tema oscuro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ─── Unified Export ─────────────────────────────────────────────────────────

export default function DashboardNavigation() {
  const pathname = usePathname();
  const { data: session }: any = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div />;

  return (
    <>
      <DesktopSidebar pathname={pathname} session={session} />
      <MobileNavbar pathname={pathname} session={session} />
    </>
  );
}

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test framework is configured.

## Environment

The app requires a `.env.local` file with:
- `MONGODB_URI` — MongoDB connection string
- `NEXTAUTH_SECRET` — NextAuth secret
- `NEXTAUTH_URL` — App base URL
- Cloudinary credentials for image uploads

## Architecture

Full-stack Next.js 14 app using the App Router. Everything lives in a single codebase — API routes and UI together.

**Request flow:**
1. All visitors are redirected to `/admin/login`
2. NextAuth credentials provider validates against the `Admin` MongoDB collection
3. `auth.ts` + `auth.config.ts` split auth logic (Edge-compatible config in `auth.config.ts`, full provider logic in `auth.ts`)
4. `middleware.ts` re-exports `auth` from `auth.ts` and protects `/admin/dashboard/**`
5. Authenticated users land on `/admin/dashboard/stock` — the main dashboard

**API routes** (`/app/api/`):
- `GET/POST /api/products` — list all products / create product
- `PUT/DELETE /api/products/[id]` — update / delete product
- `PUT /api/products/editprices` — bulk price update by percentage
- `GET/POST/PUT/DELETE /api/branches` — branch CRUD
- `GET/POST /api/categories` — category tree / create category; supports `?tree=true` for full tree, `?parentId=xxx` for direct children
- `GET/DELETE /api/categories/[id]` — single category operations
- `GET/POST/PUT/DELETE /api/employees` — employee (admin user) CRUD; GET excludes password field
- `/api/auth/[...nextauth]` — NextAuth handler

**Database** (`/lib/db/`):
- `db.ts` — Mongoose connection with connection pooling
- `models/product.ts` — Product schema (nombre, marca, categoria, precioAlPublico, precioDeLista, porcentajeGanancia)
- `models/admin.ts` — Admin/user schema with roles (ADMIN / EMPLOYEE)
- `models/branch.ts` — Branch schema (branchName, branchCode, city, state, address, phone, email, uuid)
- `models/category.ts` — Hierarchical category schema using materialized path pattern (name, slug, path, parentId, level, order, isActive)

**Services** (`/services/`):
- `categoryServices.ts` — Category business logic: `createRootCategory`, `createSubcategory`, `getDirectChildren`, `getDescendants`, `getAncestors`, `getCategoryTree`, `renameCategory`, `moveCategory`, `deleteCategory` (soft delete)

**Category model pattern:** Uses materialized paths — each category stores a comma-delimited `path` string (e.g. `,electronica,computadoras,notebooks,`) enabling efficient subtree queries with a single regex match.

**Dashboard pages** (`/app/admin/dashboard/`):
- `products/` — Product management table (moved from `stock/`; same functionality)
- `branches/` — Branch management with creation dialog and `BranchesChart` component
- `employees/` — Employee management with `EmployeesChart` component
- `settings/categories/` — Category settings page

**UI component layers:**
- `components/ui/` — Shadcn UI primitives (Radix-based, do not edit manually)
- `components/admin/` — App-specific components built on top of those primitives
  - `productList/` — `ProductTable`, `ProductDialog`, `ProductDeleteDialog`, `ProductTableColumns` (PascalCase, replacing old kebab-case files)
  - `branches/BranchesChart.tsx` — renders list of branches fetched from `/api/branches`
  - `employees/EmployeesChart.tsx` — renders list of employees
  - `DashboardNavigation.tsx` — sidebar/nav for the dashboard

**Key UI patterns:**
- TanStack React Table for the product table (search, filter, sort, pagination, row selection)
- React Hook Form + Zod for all forms; schemas live in `app/schemas/`
  - `createBranchForm.ts`, `createEmployeeForm.ts`, `editEmployeeForm.ts`
- Axios for API calls from client components
- `next-themes` for dark/light mode (class strategy)
- Toast notifications via `hooks/use-toast.ts`

**Auth architecture:**
- `auth.config.ts` — Edge-compatible config: callbacks (authorized, jwt, session), login page redirect. Exports `IAdminSession` interface.
- `auth.ts` — Full NextAuth setup with Credentials provider; exports `handlers`, `auth`, `signIn`, `signOut`
- `middleware.ts` — Re-exports `auth` from `auth.ts` as default; matches `/admin/dashboard/:path*`
- Session user shape: `{ name, surname, username, uuid, role: "ADMIN" | "EMPLOYEE" }`

**Pricing logic:** `publicPrice = listPrice * (1 + profitPercentage / 100)` — auto-calculated on create/update.

**Path alias:** `@/` maps to the project root.

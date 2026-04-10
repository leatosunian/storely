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
- Cloudinary credentials (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) for image uploads

## Architecture

Full-stack Next.js 14 app using the App Router. Everything lives in a single codebase — API routes and UI together. The app is an inventory/order management system oriented toward Argentinian retail businesses.

**Request flow:**
1. All visitors are redirected to `/admin/login`
2. NextAuth credentials provider validates against the `Admin` MongoDB collection
3. `auth.ts` + `auth.config.ts` split auth logic (Edge-compatible config in `auth.config.ts`, full provider logic in `auth.ts`)
4. `middleware.ts` re-exports `auth` from `auth.ts` and protects `/admin/dashboard/**`
5. Authenticated users land on `/admin/dashboard/products` — the main dashboard

**Path alias:** `@/` maps to the project root.

---

## API Routes (`/app/api/`)

| Route | Methods | Description |
|-------|---------|-------------|
| `/api/products` | GET, POST | List all products / create product |
| `/api/products/[id]` | GET, PUT, DELETE | Single product operations |
| `/api/products/[id]/variants` | GET, POST | Product variant management |
| `/api/products/editprices` | PUT | Bulk price update by percentage |
| `/api/variants/[id]` | GET, PUT, DELETE | Single variant operations |
| `/api/stocks` | GET | Stock levels (aggregation queries) |
| `/api/orders` | GET, POST | List orders / create order |
| `/api/orders/[id]` | GET, PUT | Single order operations |
| `/api/orders/[id]/status` | PUT | Order status transition |
| `/api/customers` | GET, POST | List customers / create customer |
| `/api/customers/[id]` | GET, PUT, DELETE | Single customer operations |
| `/api/customers/[id]/orders` | GET | Orders for a specific customer |
| `/api/branches` | GET, POST, PUT, DELETE | Branch CRUD |
| `/api/categories` | GET, POST | Category tree / create; `?tree=true` for full tree, `?parentId=xxx` for direct children |
| `/api/categories/[id]` | GET, DELETE | Single category operations |
| `/api/employees` | GET, POST, PUT, DELETE | Employee (admin user) CRUD; GET excludes password |
| `/api/upload` | POST | Cloudinary image upload |
| `/api/user` | GET | Current user profile |
| `/api/auth/[...nextauth]` | — | NextAuth handler |

---

## Database (`/lib/db/`)

**Connection:** `db.ts` — Mongoose with connection pooling.

### Models

**`models/product.ts`** — Product (`products` collection)
- `nombre`, `marca`, `modelo`, `internalCode` — basic info
- `categoryId` (ref: `categories`), `categoryPath` — materialized path for category
- `listPrice`, `publicPrice`, `profitPercent` — pricing; `publicPrice = listPrice * (1 + profitPercent / 100)`
- `hasVariants` (Boolean) — true when the product has attribute-based variants
- `attributeSchema` (array of `{ key, label, values[], order }`) — defines variant dimensions (e.g. color, size)
- `gallery` (array of `{ url, publicId, width, height }`) — Cloudinary images
- `isActive` — soft delete flag

**`models/variant.ts`** — Product Variant (`variants` collection)
- `productId` (ref: `products`), `sku` (unique, uppercase), `attributes` (Mixed — key/value pairs)
- `isDefault` (Boolean) — one default per product (enforced with partial unique index)
- `priceDelta` — price adjustment relative to base product price
- `customPrice` — override price (ignores priceDelta)
- `barcode`, `isActive`

**`models/stock.ts`** — Stock per Variant per Branch (`stocks` collection)
- `variantId` (ref: `variants`), `branchId` (ref: `branches`) — unique composite index
- `quantityOnHand`, `quantityReserved`, `quantityAvailable` — stock levels
- `reorderPoint` — threshold for reorder alerts

**`models/order.ts`** — Order (`Order` collection)
- `orderNumber` (unique, format `ORD-YYYY-NNNNN`), `customerId`, `branchId`, `employeeId`
- `items[]` — embedded `{ productId, variantId, sku, name, unitPrice, quantity, discount, subtotal }`
- `subtotal`, `discountTotal`, `tax`, `shippingCost`, `total`
- `status`: `pending → confirmed → processing → shipped → delivered → refunded` (or `cancelled` from most states)
- `paymentStatus`: `pending | paid | partial | refunded | failed`
- `paymentMethod`: `cash | transfer | card | mercadopago | other`
- `statusHistory[]` — audit trail `{ status, changedAt, changedBy, note }`
- `cancelReason`, `shippingAddress` (Mixed)

**`models/customer.ts`** — Customer (`Customer` collection)
- `firstName`, `lastName`, `email` (unique), `phone`
- `taxId`, `taxType`: `consumidor_final | responsable_inscripto | monotributista | exento` (Argentinian tax types)
- `address` — embedded `{ street, city, province, postalCode, country }` (default: Argentina)
- `branchId`, `tags[]`, `notes`, `status`: `active | inactive | blocked`
- `totalOrders`, `totalSpent`, `lastOrderAt` — auto-updated by order service

**`models/admin.ts`** — Admin/Employee (`admin_users` collection)
- `username`, `password` (hashed), `name`, `surname`, `email`, `phone`
- `uuid`, `role`: `ADMIN | EMPLOYEE`, `department`, `status`, `branchId`

**`models/branch.ts`** — Branch (`branches` collection)
- `branchName`, `branchCode` (unique), `uuid`, `city`, `state`, `address`, `phone`, `email`

**`models/category.ts`** — Category (`categories` collection) — materialized path pattern
- `name`, `slug`, `path` (e.g. `,electronica,computadoras,notebooks,`), `parentId`, `level`, `order`, `isActive`

---

## Services (`/services/`)

### `productService.ts`
Exported functions (not a class):
- `createProduct(data)` — creates product + default variant + stock rows per branch in a single MongoDB transaction
- `createProductWithVariants(data)` — creates product + multiple variants + stock rows per branch per variant in a transaction
- `addVariantToProduct(productId, variantInput)` — adds a variant and initializes stock for all branches
- `getStockTotalByProduct(productId)` — aggregation: total onHand/reserved/available across all variants and branches
- `getStockByVariant(variantId)` — stock per branch for a specific variant
- `getStockByProductAndBranch(productId, branchId)` — aggregation: available stock by variant for a product at a branch

### `categoryService.ts`
- `createRootCategory(name)` — creates level-0 category; reactivates soft-deleted duplicates
- `createSubcategory(parentId, name)` — creates child category, inheriting parent path
- `getDirectChildren(parentId)` — one-level children (for cascading dropdowns)
- `getDescendants(categoryId)` — all descendants via path regex
- `getAncestors(categoryId)` — breadcrumb ancestors by extracting slugs from path
- `getCategoryTree()` — full nested tree built in-memory (O(n), single query)
- `renameCategory(categoryId, newName)` — updates slug, path, and cascades to all descendants via `bulkWrite`
- `moveCategory(categoryId, newParentId)` — reparents category and cascades path/level to all descendants
- `deleteCategory(categoryId)` — soft delete (sets `isActive: false`) for category and all descendants

### `orderService.ts` (class, exported as `orderService`)
- `create(data)` — creates order and atomically updates customer stats (totalOrders, totalSpent) in a transaction
- `findAll(query)` — paginated + filtered list with customer/branch population
- `findById(id)` — single order with customer and branch populated
- `updateStatus(id, dto)` — enforces valid state transitions; appends to `statusHistory`; on cancel: reverts customer stats
- `delete(id)` — throws; orders are cancelled, never deleted

**Order state machine transitions:**
```
pending → confirmed, cancelled
confirmed → processing, cancelled
processing → shipped, cancelled
shipped → delivered
delivered → refunded
cancelled → (terminal)
refunded → (terminal)
```

### `customerService.ts` (class, exported as `customerService`)
- `create(data)` — creates customer; throws if email already exists
- `findAll(query)` — paginated + filtered (status, branchId, full-text search across name/email/phone)
- `findById(id)` — single customer
- `update(id, data)` — updates; checks email uniqueness
- `delete(id)` — soft delete (sets `status: "inactive"`)
- `updateStats(customerId, orderTotal, session?)` — increments order counters (called by order service)

---

## Interfaces (`/interfaces/`)

- `IProduct.ts` — `IProduct`, `IProductImage`, `IAttributeDefinition`
- `IVariant.ts` — `IVariant`
- `IStock.ts` — `IStock`
- `IOrder.ts` — `IOrder`, `IOrderItem`
- `ICustomer.ts` — `ICustomer`
- `IAddress.ts` — `IAddress`

---

## Dashboard Pages (`/app/admin/dashboard/`)

| Page | Path | Description |
|------|------|-------------|
| Products | `products/` | Product management table |
| New Product | `products/new/` | Create product form with variant builder |
| Edit Product | `products/[id]/edit/` | Edit product details |
| Orders | `orders/` | Order listing with filters |
| Create Order | `orders/create/` | Order creation form |
| Customers | `customers/` | Customer listing |
| Employees | `employees/` | Employee management |
| Branches | `branches/` | Branch management |
| Category Settings | `settings/categories/` | Category tree management |

---

## UI Component Layers

**`components/ui/`** — Shadcn UI primitives (Radix-based). Do not edit manually; regenerate via `shadcn` CLI.

**`components/admin/`** — App-specific components:

*Product management:*
- `ProductTable.tsx`, `ProductTableColumns.tsx` — TanStack Table with search/filter/sort/pagination/row selection
- `ProductForm.tsx`, `CreateProductForm.tsx` — product forms
- `ProductDialog.tsx`, `ProductDeleteDialog.tsx` — modals
- `ProductGallery.tsx` — image gallery with Cloudinary upload
- `VariantsManager.tsx`, `VariantsBuilder.tsx` — UI for defining attribute schema and building variant combinations
- `StockInitializer.tsx` — initialize stock quantities
- `LocaleNumberInput.tsx` — locale-aware number input for prices

*Order management:*
- `OrderTable.tsx` — order listing table
- `OrderStatusBadge.tsx` — color-coded status indicator
- `CreateOrderComp.tsx` — order creation form

*Other:*
- `BranchesChart.tsx` — branch list fetched from `/api/branches`
- `EmployeesChart.tsx` — employee list
- `DashboardNavigation.tsx` — sidebar navigation
- `LoginForm.tsx` — login form
- `SessionWrapper.tsx` — wraps session + theme providers
- `LoaderFullscreen.tsx` — full-screen loading state

*Customer management:*
- `app/admin/dashboard/customers/components/CustomerTable.tsx`

---

## Forms & Validation (`/app/schemas/`)

All forms use **React Hook Form + Zod**. Schemas are in `app/schemas/`:

| File | Exports |
|------|---------|
| `createBranchForm.ts` | Branch creation schema |
| `createEmployeeForm.ts` | Employee creation schema |
| `editEmployeeForm.ts` | Employee edit schema |
| `customerForm.ts` | `CreateCustomerSchema`, `UpdateCustomerSchema`, `CustomerQuerySchema` + inferred DTO types |
| `orderForm.ts` | `CreateOrderSchema`, `UpdateOrderSchema`, `UpdateOrderStatusSchema`, `OrderQuerySchema` + inferred DTO types |

---

## Auth Architecture

- `auth.config.ts` — Edge-compatible: JWT/session callbacks, login redirect. Exports `IAdminSession` interface.
- `auth.ts` — Full NextAuth v5 setup with Credentials provider (DB lookup + bcrypt). Exports `handlers`, `auth`, `signIn`, `signOut`.
- `middleware.ts` — Re-exports `auth` from `auth.ts`; matches `/admin/dashboard/:path*`.
- Session user shape: `{ name, surname, username, uuid, role: "ADMIN" | "EMPLOYEE" }`

---

## Key UI Patterns

- **Tables:** TanStack React Table (`@tanstack/react-table`) — search, filter, sort, pagination, row selection
- **Forms:** React Hook Form + Zod; schemas in `app/schemas/`
- **HTTP:** Axios for all client-side API calls
- **Theming:** `next-themes` dark/light mode (class strategy)
- **Toasts:** `hooks/use-toast.ts`
- **Animations:** Framer Motion
- **Carousels:** Embla Carousel (with autoplay plugin)
- **Date handling:** `date-fns` and `dayjs`
- **PDF/Print:** `html2canvas` + `jspdf`
- **Images:** Cloudinary via `next-cloudinary` and `cloudinary` SDK; upload route at `/api/upload`

---

## Key Conventions

- **Pricing:** `publicPrice = listPrice * (1 + profitPercent / 100)` — always auto-calculated, never stored manually
- **Soft deletes:** Products, categories, customers, employees use `isActive`/`status` flags — never hard delete
- **Transactions:** Multi-document writes (create product+variants+stock, create order+update customer) always use MongoDB sessions
- **Category paths:** Comma-delimited slugs: `,electronica,computadoras,notebooks,` — enables O(1) subtree queries with regex `^path`
- **Stock granularity:** One stock document per variant × branch — aggregate for product-level totals
- **Order immutability:** Orders are never deleted; use status `cancelled`
- **Language:** Business logic, comments, and error messages are in Spanish (Argentinian locale)
- **Model registration:** Always use the `models.ModelName ?? model(...)` pattern to avoid Mongoose re-registration errors in Next.js hot reload
- **Component naming:** PascalCase for all component files in `components/admin/`

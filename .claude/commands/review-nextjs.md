# Review Next.js Code

Review the provided file(s) or the current selection for Next.js 16 best practices, patterns, and potential issues.

## Instructions

Analyze the code and provide a structured review covering the following areas based on the file type:

### For ALL file types:
- **TypeScript**: Proper typing, no `any` abuse, correct use of generics
- **Imports**: Clean imports, no unused imports, correct use of `@/` alias
- **Performance**: Unnecessary re-renders, missing memoization where needed
- **Security**: XSS risks, injection vulnerabilities, exposed secrets

### For Page/Layout files (`page.tsx`, `layout.tsx`, `template.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`):
- Correct use of `"use client"` vs Server Components (default should be server)
- Proper metadata exports (`generateMetadata`, static `metadata`)
- Correct use of `generateStaticParams` for static generation
- Proper Suspense boundaries and streaming patterns
- Loading/error UI conventions
- Correct use of `searchParams` and `params` (async in Next.js 15+)
- Parallel routes and intercepting routes patterns
- Proper use of `redirect()`, `notFound()`, `revalidatePath()`, `revalidateTag()`

### For API Route Handlers (`route.ts`):
- Proper use of `NextRequest` / `NextResponse`
- Correct HTTP method exports (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`)
- Input validation (Zod schemas)
- Proper error handling and status codes
- Rate limiting considerations
- Correct use of `cookies()`, `headers()` (async in Next.js 15+)
- Route segment config (`dynamic`, `revalidate`, `runtime`)

### For Server Actions (files with `"use server"`):
- Proper `"use server"` directive placement
- Input validation before DB operations
- Correct use of `revalidatePath` / `revalidateTag` after mutations
- Error handling patterns (returning error objects vs throwing)
- Progressive enhancement compatibility

### For Client Components (`"use client"`):
- Justified reason for being a client component
- Minimal client boundary (keep as much as possible on the server)
- Proper use of React hooks (`useState`, `useEffect`, `useTransition`, `useOptimistic`)
- Form handling with `useActionState` / `useFormStatus`
- Event handler patterns
- Proper data fetching (SWR/TanStack Query for client-side, prefer server when possible)

### For Middleware (`middleware.ts`):
- Correct matcher config
- Edge runtime compatibility (no Node.js APIs)
- Proper use of `NextResponse.next()`, `NextResponse.redirect()`, `NextResponse.rewrite()`
- Authentication/authorization checks
- Header manipulation

### For Config files (`next.config.ts`, `tailwind.config.ts`):
- Deprecated options
- Recommended settings for Next.js 16
- Image optimization config
- Proper redirects/rewrites patterns

### For Schema/Validation files (Zod schemas):
- Proper schema composition
- Correct error messages
- Type inference with `z.infer<>`
- Reusability across client and server

### For Database Models (Mongoose/Prisma):
- Proper indexing
- Virtual fields usage
- Schema validation
- Connection handling patterns

## Output format

Structure your review as:

1. **File type detected**: What kind of Next.js file this is
2. **Issues found** (severity: critical / warning / suggestion):
   - Each issue with file location, explanation, and fix
3. **Good practices observed**: What the code does well
4. **Recommended changes**: Concrete code changes if needed

If `$ARGUMENTS` is provided, focus the review on that specific file or aspect. Otherwise, review the currently selected code or open file.

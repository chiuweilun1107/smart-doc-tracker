# Frontend Coding Style (Next.js + TypeScript)

## Framework & Language
*   **Framework:** Next.js 14+ (App Router).
*   **Language:** TypeScript (Strict mode enabled).
*   **Styling:** Tailwind CSS (Utility-first).

## Best Practices
1.  **Component Composition:** Favor smaller, reusable components over large monolithic files.
2.  **Server Components:** Use Server Components by default for data fetching. Use Client Components (`"use client"`) only when interactivity (hooks, event listeners) is needed.
3.  **Data Fetching:** Use Server Actions or `fetch` with caching in Server Components for initial data load.
4.  **State Management:** Use `React Context` or URL params for global state. Avoid Redux unless absolutely necessary.
5.  **Imports:** Use absolute imports configured in `tsconfig.json` (e.g., `@/components/Button`).

## Linting & Formatting
*   Use ESLint with `next/core-web-vitals`.
*   Use Prettier for code formatting.

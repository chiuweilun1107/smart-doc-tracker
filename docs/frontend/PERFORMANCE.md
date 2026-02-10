# Frontend Performance Guidelines

## Core Web Vitals
*   **LCP (Largest Contentful Paint):** < 2.5s. Optimize images (Next.js Image), critical CSS.
*   **FID (First Input Delay):** < 100ms. Avoid long tasks in main thread.
*   **CLS (Cumulative Layout Shift):** < 0.1. Set dimensions for images/ads.

## Optimization Strategies
1.  **Code Splitting:** Next.js handles this automatically per route. Use dynamic imports (`next/dynamic`) for heavy components only when needed.
2.  **Image Optimization:** Use `next/image` with `priority` for above-the-fold images.
3.  **Third-party Scripts:** Load non-critical scripts lazily (`next/script` with `strategy="lazyOnload"`).
4.  **Font Optimization:** Use `next/font` to optimize Google Fonts and prevent layout shifts.
5.  **Prefetching:** Next.js automatically prefetches `<Link>` components in viewport.

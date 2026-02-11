
# 🎨 Smart Doc Tracker - Design System (v2.0 Pro Max)

> **Design Philosophy**: Professional, Trustworthy, Efficient, Modern SaaS.
> **Role**: UI/UX Designer "Mia"

---

## 1. Typography (Typography)
Using system font stack is okay, but `Inter` or `Plus Jakarta Sans` adds that "SaaS" feel.
**Font Family**: `Inter`, `system-ui`, `sans-serif` (We will stick to standard sans for performance unless user allows external fonts).

- **H1 (Page Title)**: `text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50`
- **H2 (Section)**: `text-xl font-semibold tracking-tight`
- **Body**: `text-sm text-slate-600 leading-relaxed dark:text-slate-400`
- **Label**: `text-xs font-medium uppercase tracking-wider text-slate-500`

---

## 2. Color Palette (Colors)

### Primary (Brand) - "Trust Blue"
- **Primary**: `bg-blue-600` (#2563EB)
- **Hover**: `bg-blue-700` (#1D4ED8)
- **Subtle**: `bg-blue-50` (#EFF6FF)
- **Text**: `text-blue-600`

### Neutral (Slate/Zinc)
- **Background**: `bg-white` / `bg-slate-950`
- **Surface**: `bg-slate-50` / `bg-slate-900`
- **Border**: `border-slate-200` / `border-slate-800`

### Semantic
- **Success**: `text-emerald-600`, `bg-emerald-50`
- **Warning**: `text-amber-600`, `bg-amber-50`
- **Error**: `text-red-600`, `bg-red-50`

---

## 3. Components & Styles

### Cards (Glassmorphism Lite)
- **Light**: `bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl`
- **Dark**: `bg-slate-900 border border-slate-800`

### Buttons
- **Primary**: `rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 hover:shadow-blue-500/20 transition-all`
- **Secondary**: `rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50`

### Inputs
- `rounded-lg border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500`

---

## 4. Landing Page Structure (`/`)

### Hero Section
- **Headline**: "Never Miss a Government Tender Deadline Again."
- **Subheadline**: "AI-powered document tracking for smart teams. Automated parsing, Line notifications, and deadline management."
- **CTA**: [Get Started] [View Demo]
- **Visual**: 3D Stylized Abstract Document or Dashboard Mockup (Parallax).

### Features Grid (Bento Grid Style)
- **Card 1**: AI Parsing (OCR logic)
- **Card 2**: Line Integration (Instant alerts)
- **Card 3**: Project Timeline (Gantt/Calendar vibe)

### Social Proof / Stats
- "Tracking 100+ Projects", "0 Missed Deadlines"

### Footer
- Simple links.

---

## 5. Implementation Strategy
1.  **Update `globals.css`**: Define CSS variables for the color system (Tailwind v4 theme).
2.  **Refactor `layout.tsx`**: Add professional font (Inter from `next/font/google`).
3.  **Build Landing Page**: Replace default Next.js page.
4.  **Polish Dashboard**: Apply new card styles and shadows.

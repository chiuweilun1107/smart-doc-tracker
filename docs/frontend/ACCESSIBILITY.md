# Accessibility (a11y) Guidelines

## WCAG 2.1 Level AA Compliance
1.  **Semantic HTML:** Use proper tags (`<main>`, `<nav>`, `<article>`, `<button>`) instead of generic `<div>`.
2.  **Keyboard Navigation:** Ensure all interactive elements constitute a logical tab order and are focusable (`tabindex="0"`).
3.  **Color Contrast:** Ensure text contrast ratio is at least 4.5:1.
4.  **Alt Text:** All meaningful images must have `alt` attributes describing the content.
5.  **Forms:** All inputs must have associated `<label>` elements.
6.  **ARIA:** Use ARIA attributes (`aria-label`, `aria-expanded`) only when semantic HTML is insufficient.

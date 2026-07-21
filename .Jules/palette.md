## 2024-05-27 - Icon-only Button Accessibility
**Learning:** The document preview modal and search bar components contained several icon-only buttons (like zoom, rotate, and filter) that lacked ARIA labels, making them inaccessible to screen readers. Additionally, decorative icons needed to be explicitly hidden.
**Action:** Always add descriptive `aria-label` attributes to `<Button size="icon">` elements and `aria-hidden="true"` to decorative `lucide-react` icons inside them.

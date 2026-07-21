## 2024-05-27 - Icon-only Button Accessibility in Headers
**Learning:** The main site header contained several icon-only buttons (like notifications, favorites, saved searches) that lacked `aria-hidden="true"` on their inner SVG icons, creating redundant screen reader announcements.
**Action:** Always add `aria-hidden="true"` to decorative `lucide-react` icons inside `<Button size="icon">` elements when the button itself has an `aria-label`.

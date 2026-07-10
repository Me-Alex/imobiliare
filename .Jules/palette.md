## 2024-07-10 - ARIA Labels for Icon-Only Buttons
**Learning:** Found an icon-only button inside `PropertyCompare` using the `X` icon from `lucide-react` that was missing an `aria-label`. In Shadcn/UI or similar component libraries, buttons with `size="icon"` commonly omit internal text.
**Action:** Always verify that `Button` components configured with `size="icon"` or containing only an icon have a descriptive `aria-label` to ensure proper screen reader support.

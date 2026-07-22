## 2024-12-09 - Newsletter Form Accessibility
**Learning:** When adding accessibility to forms with visual icons and dynamic errors, hiding the icons (`aria-hidden="true"`) is just as critical as linking the input/label/error via ARIA attributes. Furthermore, the error container must always be present (e.g. `min-h-[20px]`) with `role="alert"` to prevent layout jank and correctly announce dynamic errors.
**Action:** Apply this comprehensive accessibility pattern (hidden label, hidden icons, stable error container, full ARIA linking) to all similar forms.

## 2024-08-01 - Adding aria-labels to icon-only buttons
**Learning:** Icon-only buttons using `lucide-react` need `aria-label` attributes on the wrapper `Button` and `aria-hidden="true"` on the icon itself to ensure screen readers announce the action correctly without redundant text. The UI text must be localized in Romanian.
**Action:** Always verify icon-only buttons across components (e.g., in `document-preview-modal.tsx` and `my-properties-list.tsx`) have these attributes set properly.

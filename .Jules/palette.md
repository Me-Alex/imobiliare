## 2024-05-18 - Missing Accessibility Attributes on Custom List Component
**Learning:** Decorative icons in lists and custom action buttons (like edit/delete) often lack `aria-hidden` and `aria-label` respectively, relying on visual cues rather than semantic meaning.
**Action:** Always verify that icon-only action buttons use `aria-label` and non-semantic decorative icons have `aria-hidden="true"`.

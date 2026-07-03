## 2024-05-15 - Accessible Async Loading States and Dynamic Announcements
**Learning:** Adding a disabled visual state to buttons during async operations is only half the battle. If a loading state doesn't have an ARIA-live region for its resulting success/error messages, screen reader users might not know the operation completed or failed.
**Action:** When implementing async forms (like `OfferSubmissionPanel`), always wrap the resulting status message in `<div aria-live="assertive">` and use `role="alert"` for the error/success paragraph to ensure dynamic announcements are made. Include a spinning icon + disabled state on the trigger button.
## 2024-05-24 - Dynamic Toggle Buttons Accessibility
**Learning:** When creating custom toggle buttons (like favorites, compare, or purpose selection pills) that change state and styling dynamically, screen readers cannot rely solely on visual CSS changes or basic `aria-label`s to understand the active state. They need explicit programmatic indication.
**Action:** Always include the `aria-pressed={boolean}` attribute on toggle buttons so their active/inactive state is correctly announced to assistive technologies.

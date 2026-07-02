## 2024-05-15 - Accessible Async Loading States and Dynamic Announcements
**Learning:** Adding a disabled visual state to buttons during async operations is only half the battle. If a loading state doesn't have an ARIA-live region for its resulting success/error messages, screen reader users might not know the operation completed or failed.
**Action:** When implementing async forms (like `OfferSubmissionPanel`), always wrap the resulting status message in `<div aria-live="assertive">` and use `role="alert"` for the error/success paragraph to ensure dynamic announcements are made. Include a spinning icon + disabled state on the trigger button.

## 2025-02-20 - Custom Toggle Button States
**Learning:** The app frequently uses custom buttons styled to look like toggles or pills (e.g., Favorites, Compare, or Purpose selection) by dynamically changing their CSS based on active state. However, they lack semantic state communication for screen readers.
**Action:** When implementing custom toggle buttons that use CSS to reflect state, always include the `aria-pressed={boolean}` attribute to correctly convey their active/inactive state to assistive technologies.

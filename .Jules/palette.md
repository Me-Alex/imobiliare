## 2026-06-23 - Offer Submission Form A11y and UX
**Learning:** High-stakes async form submissions (like property offers) need explicit loading states to prevent multiple clicks, and success/error messages must be announced by screen readers.
**Action:** When creating forms, implement a 'loading' boolean state to disable the submit button and provide visual text changes, and wrap message display areas in an `aria-live="polite" aria-atomic="true"` element to ensure screen readers are informed of completion status.

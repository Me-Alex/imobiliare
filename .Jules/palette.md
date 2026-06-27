
## 2024-05-20 - Inline Form Error Accessibility
**Learning:** React state-driven forms often have inline validation errors that render dynamically. However, without linking these errors using `aria-describedby` directly to the `input` and adding an `aria-live` region, screen readers may not announce the error upon submission or focus.
**Action:** When creating or modifying form components, ensure inline validation text uses unique IDs linked to the inputs via `aria-describedby`, and use `aria-live="assertive"` on the container handling form-level validation messages.

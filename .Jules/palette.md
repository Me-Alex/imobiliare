## 2024-07-25 - [Accessible Search Inputs]
**Learning:** Adding `aria-label` directly to inputs with placeholder text is often less reliable for screen readers than linking a visually hidden `<label class="sr-only">` via `useId()`.
**Action:** Always prefer a visually hidden `<label>` element mapped with `htmlFor` instead of just adding `aria-label` to form inputs, as it provides a more robust and compliant accessible name.

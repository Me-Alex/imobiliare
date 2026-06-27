## 2024-03-20 - Interactive Feedback & A11y
**Learning:** Found that custom portal forms (Client Account Panel) lacked loading feedback on async actions and `aria-label`/`htmlFor` associations on inputs, making the UI confusing on slow networks and inaccessible for screen readers.
**Action:** Always add loading states (e.g. 'Se salveaza...') mapping to `disabled` and appropriate form accessiblity attributes (`useId`, `htmlFor`, `aria-label`) when building custom forms without full UI libraries.

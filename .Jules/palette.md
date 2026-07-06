## 2026-07-06 - [Aria-pressed for Custom Toggle Buttons]
**Learning:** Custom toggle buttons like Favorite and Compare require the `aria-pressed` attribute to properly communicate their active state to screen readers, especially when dynamic CSS classes are used to reflect their state.
**Action:** When implementing custom toggle buttons, always include `aria-pressed={boolean}`.

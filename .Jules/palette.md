## 2026-07-07 - Accessible Custom Toggle Buttons
**Learning:** When using standard `<button>` elements as interactive custom toggles (like "Favorite", "Compare", "View Mode", or selection pills) where visual state changes (like CSS classes), they lack native semantic toggle state for screen readers. They need `aria-pressed={boolean}` explicitly applied.
**Action:** Always add `aria-pressed={boolean}` to dynamically styled standard `<button>` elements that represent a two-state active/inactive toggle.

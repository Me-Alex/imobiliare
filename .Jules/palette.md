## 2025-03-09 - Added aria-pressed for Toggle Buttons
**Learning:** When using icon-only buttons as stateful toggles (like favorites or compare functionality), screen readers cannot determine whether the toggle is active or not just by visually swapping CSS classes or icons. Using `aria-pressed` is crucial for correctly announcing state.
**Action:** Always add `aria-pressed={boolean}` to any custom button that behaves as a state toggle, especially those without explicit label text.

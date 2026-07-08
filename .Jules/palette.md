## 2024-05-18 - Toggle Button Accessibility
**Learning:** Custom toggle buttons (like favorites or compare) need `aria-pressed` to announce their state to screen readers, instead of relying purely on visual cues or `aria-label` swaps which can be confusing.
**Action:** Always add `aria-pressed={booleanState}` to buttons that act as toggles.

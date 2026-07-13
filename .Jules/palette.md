## 2024-07-13 - [aria-pressed for state toggles]
**Learning:** Toggle buttons (like favorite/compare) lacking native checked states fail to convey their current status to screen readers, causing accessibility issues.
**Action:** Always include the `aria-pressed={boolean}` attribute on custom toggle buttons to ensure their active/inactive state is correctly announced.

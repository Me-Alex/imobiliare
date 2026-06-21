## 2024-06-21 - Added Aria Labels to Icon Buttons
**Learning:** Icon buttons that use SVGs and a `title` attribute for tooltips in the `AdminCommandCenter.tsx` components do not provide adequate accessibility for screen readers. Explicit `aria-label` attributes must be added.
**Action:** When inspecting icon-only buttons in complex UI components (like dashboards), always ensure `aria-label` attributes are present even if `title` is used.


## 2024-05-30 - ARIA Labels on Icon-Only List Actions
**Learning:** Icon-only buttons used for custom actions within list items (like edit and delete buttons in the property management list) often miss ARIA labels because they are visually distinguished by icons and tooltips/hover states. Screen readers, however, need explicit labels to convey the action to visually impaired users.
**Action:** When implementing custom list actions with icon-only buttons, always ensure an `aria-label` attribute is provided, clearly indicating the action (e.g., `aria-label="Editeaza proprietatea"`).

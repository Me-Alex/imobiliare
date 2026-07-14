# Task: Break up programare-vizionare-page.tsx into sub-components

## Result

### Lines before/after (main page file)
| | Lines |
|---|---|
| Before | **837** |
| After | **275** |
| Reduction | **67%** (−562 lines) |

### New files created under `src/components/vizionare/`

| File | Lines | Responsibility |
|---|---|---|
| `step-indicator.tsx` | 62 | Step 1/2/3 progress dots, labels, connecting lines |
| `property-picker-step.tsx` | 142 | Property list with demo fallback, auth gate |
| `staff-date-picker-step.tsx` | 254 | Agent cards, 14-day mini calendar, time slot picker |
| `confirmation-step.tsx` | 124 | Summary card, notes textarea, confirm button |
| **Total** | **582** | |

### What changed in the main page
- Kept only: `seedAvailability()` helper, state management (`useState`), handler functions (`handlePropertySelect`, `handleSubmit`, etc.), step navigation logic, and the layout shell (`PageHero`, `AnimatePresence`, nav buttons).
- Removed all inline sub-component definitions (`StepIndicator`, `StepPropertySelection`, `StepAgentDate`, `StepConfirmation`).
- Imports now reference the extracted components from `@/components/vizionare/*`.

### ESLint
- `npx eslint src/views/programare-vizionare-page.tsx src/components/vizionare/` — **zero errors, zero warnings**.
# Task 2-b: Notifications Panel Component

## Agent: notifications-panel

## Summary
Created `src/components/notifications-panel.tsx` — a fully client-side, controlled notifications dropdown/sheet component for the HQS Imobiliare app.

## What was built

### Component: `NotificationsPanel`
- **Props**: `{ open: boolean; onOpenChange: (open: boolean) => void }` — parent controls visibility
- **Desktop**: Renders a portal-based dropdown (positioned `fixed right-4 top-14`) with framer-motion enter/exit animations, click-outside and Escape-key dismissal
- **Mobile** (`< 768px`): Uses shadcn `Sheet` (right side) for a full-height slide-in panel
- **Custom scrollbar**: Thin 4px scrollbar with light/dark mode support (added `.notifications-scroll` CSS class to `globals.css`)

### Exported: `addNotification(notification)`
- Helper function any component can import to push a notification to `hqs_notifications` in localStorage
- Auto-generates `id`, sets `read: false`, `createdAt: now`, enforces max 20 notifications (oldest trimmed)
- Dispatches `hqs-notifications-updated` custom event for live reactivity

### Exported: `NotificationItem` interface
- `id`, `type`, `title`, `message`, `read`, `createdAt`, `link?` (PageKey)

### Notification types & icons (Lucide)
| Type | Icon | Color |
|------|------|-------|
| `property_published` | Building2 | amber |
| `vizionare_scheduled/reminder/completed` | CalendarCheck | emerald |
| `document_uploaded/signed` | FileText | violet |
| `system` | Bell | primary |

### Behavior
- Sorted by `createdAt` descending
- Unread indicator: small primary-colored dot on left + `bg-primary/5` tint + `border-l-2 border-l-primary`
- "Marcheaza toate ca citite" button (marks all read)
- Clicking a notification marks it as read and navigates via `useAppStore().navigateTo` if `link` is provided
- "Sterge toate" button clears all notifications
- Empty state: Bell icon + "Nicio notificare" text
- Relative time: "acum 5 min", "acum 2 ore", "ieri", "acum 3 zile", etc.

### Files changed
- **Created**: `src/components/notifications-panel.tsx`
- **Modified**: `src/app/globals.css` (added `.notifications-scroll` scrollbar styles)

### Lint
- No new lint errors introduced (pre-existing error in `dashboard-page.tsx` unrelated)
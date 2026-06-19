## 2025-03-01 - Missing Async Loading States in Client Actions
**Learning:** Found that key user actions like updating profiles or adding documents lacked any loading states, leaving users unsure if their clicks registered during network latency.
**Action:** Always ensure async functions in UI components have corresponding `isSubmitting` / `isLoading` state variables, and use them to disable submit buttons and update their labels to reflect ongoing activity.

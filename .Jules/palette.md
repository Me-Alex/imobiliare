## 2024-07-14 - Dynamic Form Validation Announcement
**Learning:** Screen readers may fail to announce validation errors if the container with `role="alert"` or `aria-live="assertive"` is conditionally rendered into the DOM.
**Action:** Always render the error container in the DOM (even if empty) and only conditionally render the error text within it.

## 2024-07-14 - Decorative Icons Screen Reader Noise
**Learning:** Lucide icons placed inside inputs or buttons without text content can cause unnecessary noise or confusion for screen reader users.
**Action:** Always add `aria-hidden="true"` to decorative icons.

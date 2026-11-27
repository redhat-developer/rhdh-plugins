---
'@red-hat-developer-hub/backstage-plugin-app-defaults': minor
---

Add optional `app.sidebar.defaultPinned` so admins can set the org default sidebar pin state for users who have not saved a preference. Saved localStorage preferences still win; invalid or unset config keeps the pinned product fallback.

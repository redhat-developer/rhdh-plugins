---
'@red-hat-developer-hub/backstage-plugin-quickstart': patch
---

Fix Quickstart drawer re-opening on close by scoping drawer flags per user, caching resolved role per session, and filtering items only when the drawer is open; preserves first-time auto-open and respects manual close.

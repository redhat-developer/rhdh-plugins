---
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant': patch
---

Show notebook RAG source chips as soon as the assistant response completes, without requiring a page refresh. Redirect unknown Intelligent Assistant URLs to `/intelligent-assistant` when chat is allowed, or show a 404 when it is denied. Fix overlay chat loader positioning by waiting for PatternFly CSS before mounting ChatbotModal (RHDHBUGS-3803). Scope chat rename/delete modals to the overlay/docked container so they are not clipped by the history drawer.

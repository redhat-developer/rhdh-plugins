---
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant': patch
---

Fix overlay chat shifting to the left when Quickstart (or any docked drawer) is open by stopping a second `DOCKED_CONTENT_OFFSET` margin — horizontal position already follows the measured FAB inset.

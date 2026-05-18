---
'@red-hat-developer-hub/backstage-plugin-lightspeed': patch
---

Scope all JSS class names with a `lightspeed-` prefix via seeded `StylesProvider` to prevent CSS collisions with other dynamically loaded plugins in RHDH.

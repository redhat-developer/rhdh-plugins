---
'@red-hat-developer-hub/backstage-plugin-global-floating-action-button': patch
---

Scope JSS class names with a `global-fab-` prefix via seeded `StylesProvider` to prevent CSS collisions with other dynamically loaded plugins in RHDH.

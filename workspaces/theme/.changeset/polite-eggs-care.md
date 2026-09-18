---
'@red-hat-developer-hub/backstage-plugin-theme': patch
---

Wrap toggle button items to prevent clipped overflow (RHDHBUGS-3622)

This is a global `MuiToggleButtonGroup` theme override — it applies to every `ToggleButtonGroup` in RHDH, including those in dynamic plugins. Groups with two items will not wrap in practice, but consumers with wider groups should be aware.

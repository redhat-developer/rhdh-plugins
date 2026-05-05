---
'@red-hat-developer-hub/plugin-cost-management': patch
---

Fix `menuItems` keys in `app-config.dynamic.yaml` to use dots instead of slashes as path separators, so that "Optimizations" and "OpenShift" are properly nested under the "Cost management" parent menu in the RHDH sidebar.

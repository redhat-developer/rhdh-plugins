---
'@red-hat-developer-hub/backstage-plugin-app-defaults': patch
'@red-hat-developer-hub/backstage-plugin-app-react': patch
---

Remove the redundant Search entry from the sidebar menu. Title-less sidebar items are no longer rendered but still claim their page path, and the default sidebar now ships such placeholder items for `/search` and `/create`. The search modal is disabled by default.

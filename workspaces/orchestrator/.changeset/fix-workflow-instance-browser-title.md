---
'@red-hat-developer-hub/backstage-plugin-orchestrator': patch
---

Fix browser tab showing `[object Object]` on workflow instance page

Replace `<Trans>` component with `t()` function for page title to ensure a string is returned instead of an element, which was causing `[object Object]` to appear in the browser tab title.

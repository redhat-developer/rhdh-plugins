---
'@red-hat-developer-hub/backstage-plugin-bulk-import': patch
---

Fixed approval tool selection resetting to GitHub when clicking Preview file by preventing unintended router navigation that stripped the approvalTool query parameter from the URL.

---
'@red-hat-developer-hub/backstage-plugin-x2a-backend': patch
---

Improve error propagation in job script: consolidate error handling into run_x2a function with default message and appended error details, add command logging, and refactor publish-aap to use the shared error handler.

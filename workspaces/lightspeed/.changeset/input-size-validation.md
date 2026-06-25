---
'@red-hat-developer-hub/backstage-plugin-lightspeed-backend': patch
---

Add input size validation for queries and attachments to prevent resource exhaustion. Queries are limited to 32K characters, individual attachments to 20MB, and total attachments to 50MB.

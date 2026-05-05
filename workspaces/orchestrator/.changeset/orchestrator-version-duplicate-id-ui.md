---
'@red-hat-developer-hub/backstage-plugin-orchestrator': patch
---

- Add **Version** column to the workflows table and a **Version** field on the workflow details card when the overview API provides `version`.
- Show **Version** on the workflow run (**execution**) details card (same overview data as the workflow definition page).
- Show a **warning** alert when the workflow list contains duplicate `workflowId` values, with a **Learn more** link to Red Hat documentation on unique workflow ID requirements.

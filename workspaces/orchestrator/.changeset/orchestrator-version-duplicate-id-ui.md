---
'@red-hat-developer-hub/backstage-plugin-orchestrator': patch
---

- Add **Version** column to the workflows table (after Description) and a **Version** field on the workflow details card when the overview API provides `version`.
- Show an **info** alert when the workflow list contains duplicate `workflowId` values, with a **Learn more** link to Red Hat documentation on unique workflow ID requirements.

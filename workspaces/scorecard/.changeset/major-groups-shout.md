---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-github': patch
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-dora': patch
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-jira': patch
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': patch
---

Rename DORA-specific collector IDs to make their scope explicit and avoid conflicts with potential future generic collectors:

- `github:deployments` -> `github:doraDeployments`
- `github:deploymentWorkflowRuns` -> `github:doraDeploymentWorkflowRuns`
- `github:deploymentPullRequests` -> `github:doraDeploymentPullRequests`
- `jira:incidents` -> `jira:doraIncidents`

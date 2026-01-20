---
'@red-hat-developer-hub/backstage-plugin-orchestrator': patch
'@red-hat-developer-hub/backstage-plugin-orchestrator-backend': patch
---

feat: Improve permission denied error handling for workflow instances

- Add PermissionDeniedPanel component for clean access denied UI
- Improve backend error messages when user lacks instanceAdminView permission
- Provide detailed error messages explaining why access is denied:
  - When instance has no ownership info (external/legacy runs)
  - When instance was created by another user

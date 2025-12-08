---
'@red-hat-developer-hub/backstage-plugin-bulk-import': minor
---

Improve bulk import UI consistency and user experience

- Ensure "Bulk import" navigation in left sidebar takes users directly to Import page
- Hide source control tool radio buttons when only one provider is configured
- Remove Repository/Organization toggle buttons from Import page
- Update empty state message for better user guidance
- Hide the "Import to Red Hat Developer Hub" top info bar
- Added "Missing Configuration" page that displays when no GitHub or GitLab integrations are configured
- Show "Task status" column header when scaffolder flow is enabled
- Show "Ready to import" instead of "Not generated" status in scaffolder flow
- Remove "Preview file" button for selected repositories in scaffolder flow
- Fix task status display to show status text + separate "View task" button

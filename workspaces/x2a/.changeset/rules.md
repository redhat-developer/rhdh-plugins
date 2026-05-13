---
'@red-hat-developer-hub/backstage-plugin-x2a-common': minor
'@red-hat-developer-hub/backstage-plugin-scaffolder-backend-module-x2a': minor
'@red-hat-developer-hub/backstage-plugin-x2a-backend': patch
'@red-hat-developer-hub/backstage-plugin-x2a': patch
'@red-hat-developer-hub/backstage-plugin-x2a-mcp-extras': patch
---

feat(x2a): Add `Rules` API

This add a way to create into the init phase the x2a-rules introduced on x2a-convertor, and take advantage of the INPUT-AGENTS.md and EXPORT-AGENTS.md

Summary of Changes:

- New /rules/ api endpoints. (only admin can add it)
- New Configmap on init phase.
- Small changes on the script template.
- New MCP tool to list all rules: x2a-list-rules (Also updated the project create)
- Change on CSV to support rules.

---
'@red-hat-developer-hub/backstage-plugin-x2a': patch
'@red-hat-developer-hub/backstage-plugin-x2a-common': patch
'@red-hat-developer-hub/backstage-plugin-x2a-backend': patch
---

Add an Edit in Codespaces action beside GitHub migrated sources, using the target branch and Ansible devcontainer configuration. Copy the generated Ansible devcontainer configuration into the target repository and include it in the migration commit. Also match Ansible role-name sanitization in migration jobs and prefer rebased job output when resolving repository conflicts.

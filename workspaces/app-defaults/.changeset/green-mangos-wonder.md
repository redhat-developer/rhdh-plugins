---
'@red-hat-developer-hub/backstage-plugin-app-integrations': patch
'@red-hat-developer-hub/backstage-plugin-app-auth': patch
---

# New auth and integration plugins for the new frontend system

Introduces app-auth (sign-in + auth APIs) and app-integrations (default ScmAuth), migrated from RHDH’s old frontend wiring. Better misconfiguration errors for sign-in, less noisy test logs, ESLint fixes for pre-commit, and README updates.

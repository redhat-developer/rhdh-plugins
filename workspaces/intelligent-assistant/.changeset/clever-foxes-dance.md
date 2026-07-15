---
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant': major
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant-backend': major
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant-common': major
---

BREAKING CHANGE: The configuration namespace has been renamed from `lightspeed` to `intelligent-assistant`. Update your `app-config.yaml` to replace `lightspeed:` with `intelligent-assistant:`. RBAC permission policy names have also been renamed (e.g., `lightspeed.chat.read` → `intelligent-assistant.chat.read`). Update your `rbac-policy.csv` accordingly. See the migration guide in the lightspeed-backend plugin's README for full details.

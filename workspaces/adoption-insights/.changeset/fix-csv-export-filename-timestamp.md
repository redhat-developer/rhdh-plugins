---
'@red-hat-developer-hub/backstage-plugin-adoption-insights': patch
---

Fixed CSV export filename to include timestamp for better file identification and to avoid naming conflicts. Active Users CSV exports now use format "active_users_YYYY-MM-DD_HH-mm-ss-SSS.csv" instead of generic "active_users"

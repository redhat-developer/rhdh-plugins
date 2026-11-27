---
'@red-hat-developer-hub/backstage-plugin-adoption-insights-backend': minor
'@red-hat-developer-hub/backstage-plugin-adoption-insights-common': minor
---

Store each signed-in user's time-saved notification frequency in a new `notification_preferences` table. Add GET and PUT `/api/adoption-insights/notification-preference` routes and export the frequency values, default, and preference types from adoption-insights-common.

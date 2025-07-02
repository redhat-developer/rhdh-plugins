---
'@red-hat-developer-hub/backstage-plugin-adoption-insights-backend': patch
'@red-hat-developer-hub/backstage-plugin-adoption-insights': patch
---

Timezone Fixes for Consistent Data Grouping and Display

- Backend now accepts an explicit timezone parameter from the frontend instead of relying on Intl.DateTimeFormat().resolvedOptions().timeZone.
- This eliminates discrepancies between frontend simulation and backend processing.
- Accurate Date Range Construction
- Updated PostgreSQL query to respect user timezone.
- Tooltips now show formatted times based on user's selected timeszone.

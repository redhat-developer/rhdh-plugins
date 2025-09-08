---
'@red-hat-developer-hub/backstage-plugin-adoption-insights': patch
---

Pagination and title consistency improvements:

- Fixed dynamic "Top X" pagination options to adapt to actual item count, resolving misleading filter options when dataset is smaller than defaults
- Added "All" option for datasets smaller than maxDefaultOption (20 items)
- Improved component title consistency across the UI

---
'@red-hat-developer-hub/backstage-plugin-bulk-import-backend': minor
---

**BREAKING** Changes the behavior of the bulk-import backend plugin to return only repositories that are yet to be imported by filtering out the already imported ones. Therefore, the frontend will not display already imported repositories with status displayed as "Imported" anymore. The frontend fetches all repositories at once on the first page load and then all the pagination and search is done client-side.

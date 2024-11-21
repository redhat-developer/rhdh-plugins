---
'@red-hat-developer-hub/backstage-plugin-bulk-import-backend': minor
---

Introduced a new response key 'source' in the GET /imports endpoint to indicate from which source the import originated from ('config', 'location', 'integration'). In case of duplicates, it returns first source it finds in order 'config', 'location', 'integration'.

---
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant-backend': patch
---

Ensure user-scoped Core proxy requests contain only the authenticated user ID. Match identity exemptions by GET method and exact route, allowing an optional trailing slash, and remove caller-supplied identities from exempt requests.

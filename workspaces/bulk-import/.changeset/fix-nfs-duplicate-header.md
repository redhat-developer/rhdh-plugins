---
'@red-hat-developer-hub/backstage-plugin-bulk-import': patch
---

- Fixed duplicate header in NFS app by adding `noHeader: true` to the PageBlueprint configuration
- Persist selected approval tool (GitHub/GitLab) in URL parameter to survive page refresh
- Fixed large empty space between table rows and pagination on the last page when rows is less than rows-per-page

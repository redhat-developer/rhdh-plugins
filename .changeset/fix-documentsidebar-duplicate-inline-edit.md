---
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant': patch
---

Fix a duplicate `useInlineEdit` declaration in the notebook `DocumentSidebar` that redeclared `isEditingTitle`/`saveTitle`/`handleTitleKeyDown` and broke the frontend build.

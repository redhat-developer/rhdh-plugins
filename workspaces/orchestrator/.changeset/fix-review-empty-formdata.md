---
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-react': patch
---

fix: avoid Review step crash when form data is empty (for example display-only `ActiveText` with no submitted values). `generateReviewTableData` returns `{}` instead of undefined, and `NestedReviewTable` handles missing data.

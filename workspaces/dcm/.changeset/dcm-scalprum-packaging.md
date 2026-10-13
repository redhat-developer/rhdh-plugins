---
'@red-hat-developer-hub/backstage-plugin-dcm': patch
---

Fix dynamic frontend packaging so RHDH Scalprum can discover and mount `/dcm`.

Add explicit `scalprum` metadata to the frontend package, and pin the OCI
export CLI to 1.11.4 so the image includes `dist-scalprum` (CLI 2.x only
emits Module Federation assets under `dist/`, which leaves `/dcm` as an
unknown SPA route).

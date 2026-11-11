---
'@red-hat-developer-hub/backstage-plugin-quickstart': minor
---

Migrate QuickStart UI from Material UI to Backstage UI (`@backstage/ui`) and Remix icons. Snackbar prompts now use `toastApi` instead of MUI Snackbar. Drop the `@mui/material` dependency and legacy `ClassNameGenerator` side effect. Visual styling uses BUI/PF tokens; document screenshot diffs in the PR.

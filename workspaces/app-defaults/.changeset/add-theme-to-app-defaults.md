---
'@red-hat-developer-hub/backstage-plugin-app-defaults': minor
---

Move the RHDH theme into the app-defaults plugin (`src/theme`) so the feature loader ships light/dark ThemeBlueprint extensions, fonts, and BUI tokens by default. Remove the standalone `workspaces/theme` workspace; `@red-hat-developer-hub/backstage-plugin-theme` is soft-deprecated / archived at its last published version.

`app.branding` config (`theme`, `customCSS`, logos) is unchanged. Hosts that already load the app-defaults feature loader get the theme with no new import. Prefer `./theme-module` / `./theme-legacy` only when registering the theme outside the feature loader; migrate off `@red-hat-developer-hub/backstage-plugin-theme` to the app-defaults feature loader.

---
'@red-hat-developer-hub/backstage-plugin-theme': minor
'@red-hat-developer-hub/backstage-plugin-bui-test': patch
---

feat: allow customers to customize BUI components via app-config (RHIDP-14510)

Adds two new `app.branding` configuration options:

- `customCSS`: raw CSS string injected as global styles (use at your own risk)
- `theme.{light|dark}.bui.tokens`: per-theme structured token overrides mapping to BUI CSS custom properties (`--bui-*`), allowing different values for light and dark themes

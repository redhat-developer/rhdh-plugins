---
'@red-hat-developer-hub/backstage-plugin-theme': patch
---

Fix broken `config.d.ts` import path: change `import { ThemeConfig } from './src'` to `'./'` so the published package resolves correctly during config schema validation.

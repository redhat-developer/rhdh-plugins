---
'@red-hat-developer-hub/backstage-plugin-theme': patch
---

Fix Red Hat font loading in production app bundles by injecting @font-face from the package entrypoints via `fonts.ts` (webpack-resolved woff2 URLs) instead of `font.min.css` styleInject paths that stay relative and fail under publicPath.

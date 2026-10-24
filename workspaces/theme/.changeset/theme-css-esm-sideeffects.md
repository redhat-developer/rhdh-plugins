---
'@red-hat-developer-hub/backstage-plugin-theme': patch
---

Fix missing BUI `component-overrides` CSS (e.g. Card borders) in production RHDH app bundles by expanding `sideEffects` to keep published `*.css.esm.js` styleInject modules from being tree-shaken.

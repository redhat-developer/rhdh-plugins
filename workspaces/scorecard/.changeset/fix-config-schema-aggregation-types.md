---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': patch
---

Fix config schema generation during `prepack` by using string literal aggregation types in `config.d.ts` instead of `typeof aggregationTypes.*` references that Backstage cannot resolve.

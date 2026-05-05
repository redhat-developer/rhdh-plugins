---
'@red-hat-developer-hub/backstage-plugin-bulk-import': patch
---

Corrected `dataFetcher` return type to include `Response` and replaced unsafe type casts with `instanceof` narrowing.

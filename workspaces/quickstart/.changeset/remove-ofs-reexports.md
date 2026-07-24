---
'@red-hat-developer-hub/backstage-plugin-quickstart': major
---

**Breaking:** Legacy (OFS) component exports have been removed from the main `./` entry point and are now exclusively available at the `./legacy` subpath. OFS consumers must update their imports:

```diff
- import { QuickstartDrawerProvider } from '@red-hat-developer-hub/backstage-plugin-quickstart';
+ import { QuickstartDrawerProvider } from '@red-hat-developer-hub/backstage-plugin-quickstart/legacy';
```

---
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant': major
---

**Breaking:** Legacy (OFS) component exports have been removed from the main `./` entry point and are now exclusively available at the `./legacy` subpath. OFS consumers must update their imports:

```diff
- import { LightspeedDrawerProvider } from '@red-hat-developer-hub/backstage-plugin-lightspeed';
+ import { LightspeedDrawerProvider } from '@red-hat-developer-hub/backstage-plugin-lightspeed/legacy';
```

**New:** Graduate the New Frontend System (NFS) plugin from `./alpha` to the primary `./` entry point.

Translations remain at `./alpha`. Existing OFS dynamic plugin configurations using `module: Legacy` continue to work unchanged.

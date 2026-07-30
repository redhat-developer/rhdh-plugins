---
'@red-hat-developer-hub/backstage-plugin-theme': major
---

**BREAKING**: Graduated the New Frontend System (NFS) theme module to stable API.

The NFS theme module has been promoted from the `./alpha` subpath to the primary `.` entry point. The `./alpha` subpath has been removed.

Legacy (OFS) exports (`getThemes`, `getAllThemes`, `LogoFull`, `LogoIcon`, etc.) have been moved to the new `./legacy` subpath.

**Migration for NFS consumers (previously using `./alpha`):**

```diff
- import { rhdhThemeModule } from '@red-hat-developer-hub/backstage-plugin-theme/alpha';
+ import rhdhThemeModule from '@red-hat-developer-hub/backstage-plugin-theme';
```

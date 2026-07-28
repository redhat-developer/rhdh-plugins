---
'@red-hat-developer-hub/backstage-plugin-homepage': minor
---

Export `homePagePlugin` (upstream `@backstage/plugin-home` with homepage layout and widgets via `withOverrides`) as the alpha default so Module Federation / dynamic NFS installs register `page:home` without a separate `@backstage/plugin-home` dependency. Keep `homePageModule` for hosts that already register `homePlugin`.

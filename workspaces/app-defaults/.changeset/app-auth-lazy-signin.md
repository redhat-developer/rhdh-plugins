---
'@red-hat-developer-hub/backstage-plugin-app-auth': minor
---

**BREAKING**: `SignInPage` is no longer exported from `@red-hat-developer-hub/backstage-plugin-app-auth/alpha`. Use `appAuthModule` (or the package default export); the page loads through `SignInPageBlueprint` with a dynamic `import()`.

Replaces `import appPlugin from '@backstage/plugin-app'` + extension override with `SignInPageBlueprint` from `@backstage/plugin-app-react` so the NFS alpha Module Federation sync chunk no longer pulls the full `@backstage/plugin-app` tree (AppRoot, `@backstage/ui`, framer-motion, markdown, MUI v4).

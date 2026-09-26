---
'@red-hat-developer-hub/backstage-plugin-app-auth': patch
---

Expose `auth.providers.guest` to the frontend config schema so the NFS SignInPage can discover the Guest provider after #4716 (restores the e2e Enter button).

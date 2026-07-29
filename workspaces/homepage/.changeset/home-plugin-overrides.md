---
'@red-hat-developer-hub/backstage-plugin-homepage': minor
---

Give the homepage NFS plugin its own configurable page (`page:homepage`) so it works without community `@backstage/plugin-home`, and apply persona-based `homepage.defaultWidgets` filtering only on that page via homepage-backend. When `homepageHomeModule` is installed, the same widgets are also registered on community `page:home` (without the RH layout / homepage-backend filtering). Community `page:home` and `page:homepage` can be enabled or disabled independently via app-config.

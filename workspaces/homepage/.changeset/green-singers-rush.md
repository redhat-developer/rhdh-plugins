---
'@red-hat-developer-hub/backstage-plugin-dynamic-home-page': minor
'@red-hat-developer-hub/backstage-plugin-homepage-backend': minor
'@red-hat-developer-hub/backstage-plugin-homepage-common': minor
---

Homepage default content is now resolved through a new backend with RBAC, widget-oriented configuration, and translated titles. Bumps `@red-hat-developer-hub/backstage-plugin-theme` to `^0.14.1`.

**`@red-hat-developer-hub/backstage-plugin-dynamic-home-page`**

- Load default widgets from the homepage backend API (permission-aware), with a frontend API client and hooks.

**`@red-hat-developer-hub/backstage-plugin-homepage-backend` and `@red-hat-developer-hub/backstage-plugin-homepage-common`**

- Initial release: backend resolves default widgets using user context, `if` conditions; shared types and permission definitions live in homepage-common.

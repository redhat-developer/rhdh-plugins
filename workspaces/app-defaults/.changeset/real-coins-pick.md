---
'@red-hat-developer-hub/backstage-plugin-app-auth': minor
---

Replaces the broken Guest/GitHub fallback with a descriptive ErrorPanel when auth.providers is empty or misconfigured. Removed DEFAULT_PROVIDER = 'github', auth providers need to explicitly installed dynamically. Also removed behavior when default Guest login when `auth.environment` is development.

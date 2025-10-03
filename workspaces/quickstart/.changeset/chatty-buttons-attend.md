---
'@red-hat-developer-hub/backstage-plugin-quickstart': patch
---

Fixes the issue where the quickstart drawer was reserving space for users with no eligible items

- Centralize role determination at provider level to avoid re-fetching on drawer open/close
- Add multi-layer protection to prevent empty drawer space when user has no eligible quickstart items
- Remove complex caching logic from useQuickstartRole hook for cleaner implementation
- Update components to use role from context instead of calling hook directly
- Fix test mocks to work with new context-based architecture

This resolves the issue where the quickstart drawer would open an empty space when the current user has no quickstart items configured for their role.

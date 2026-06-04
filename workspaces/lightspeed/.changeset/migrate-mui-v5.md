---
'@red-hat-developer-hub/backstage-plugin-lightspeed': patch
---

Migrated from Material UI v4 (`@material-ui/*`) to MUI v5 (`@mui/material`, `@mui/styles`). Replaced all `makeStyles`/`createStyles` usage with `styled()` and `sx` prop. Added `StylesProvider` with seeded `createGenerateClassName` for JSS collision prevention. Added ESLint restrictions to prevent `@material-ui/*` imports from being reintroduced.

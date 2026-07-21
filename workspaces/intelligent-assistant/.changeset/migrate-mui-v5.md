---
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant': patch
---

Migrated from Material UI v4 (`@material-ui/*`) to MUI v5. Replaced `makeStyles` with `tss-react/mui` (emotion-based) for complex components and `styled()`/`sx` for simple cases. Removed `@mui/styles` dependency and `StylesProvider`/`createGenerateClassName` JSS wrapper. Added ESLint restrictions to prevent `@material-ui/*` and `@mui/styles` imports from being reintroduced.

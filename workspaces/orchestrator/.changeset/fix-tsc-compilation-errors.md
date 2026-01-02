---
'@red-hat-developer-hub/backstage-plugin-orchestrator': patch
'@red-hat-developer-hub/backstage-plugin-orchestrator-common': patch
'@red-hat-developer-hub/backstage-plugin-scaffolder-backend-module-orchestrator': patch
---

Fix TypeScript compilation errors (RHIDP-11204)

This change fixes multiple TypeScript compilation errors that were preventing Konflux builds from succeeding:

1. **Import path fixes**: Corrected `@backstage/types/index` imports to `@backstage/types` in 7 source files across multiple packages

2. **Missing type declarations**: Added `@types/js-yaml` to devDependencies in orchestrator-common and scaffolder-backend-module-orchestrator packages

3. **Missing peer dependencies**: Added `react`, `react-dom`, and `react-router-dom` to orchestrator package devDependencies to resolve dynamic plugin export requirements

Files modified:

- Source files with import path corrections
- package.json files with added dependencies

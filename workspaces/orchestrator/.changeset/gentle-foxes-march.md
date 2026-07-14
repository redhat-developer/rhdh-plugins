---
'@red-hat-developer-hub/backstage-plugin-orchestrator': patch
---

Fix unintended Workflows tab on User profile pages by converting the entity tab condition from a React hook-based component to a plain predicate function and using the built-in hasAnnotation checker in dynamic plugin config

# @red-hat-developer-hub/backstage-plugin-konflux-backend

## 0.1.8

### Patch Changes

- 5148408: Migrated to Jest 30 as required by @backstage/cli 0.36.0.
- Updated dependencies [5148408]
  - @red-hat-developer-hub/backstage-plugin-konflux-common@0.1.8

## 0.1.7

### Patch Changes

- 378b871: Bump Backstage dependencies from 1.45.2 to 1.49.4 to align with RHDH 1.10. Fix Latest Releases not shown when applications field is omitted or uses wildcard patterns.
- Updated dependencies [378b871]
  - @red-hat-developer-hub/backstage-plugin-konflux-common@0.1.7

## 0.1.6

### Patch Changes

- dff3b21: Feat: add wildcard (_) and glob pattern support (e.g. my-app-_, \*-backend) for the applications field in konflux-ci.dev/clusters annotation.
  Feat: allow omitting applications to fetch all applications from a namespace.
  - @red-hat-developer-hub/backstage-plugin-konflux-common@0.1.6

## 0.1.5

### Patch Changes

- 061a265: - Fix: replace unfiltered catalog scan in getRelatedEntities with targeted lookup using hasPart relations and getEntitiesByRefs.
  - Perf: cache K8s API clients per cluster and catalog lookups (30s TTL) to avoid redundant work across parallel requests.
  - Perf: strip metadata.managedFields from K8s and Kubearchive responses to reduce payload size.
  - @red-hat-developer-hub/backstage-plugin-konflux-common@0.1.5

## 0.1.4

### Patch Changes

- 74f6ae3: Drop @visibility frontend on konflux and clusters containers so backend secrets don’t inherit frontend visibility during schema merge.
- Updated dependencies [74f6ae3]
  - @red-hat-developer-hub/backstage-plugin-konflux-common@0.1.4

## 0.1.3

### Patch Changes

- 98ab178: Separate Konflux frontend and backend config schemas to avoid visibility conflicts.
- Updated dependencies [98ab178]
  - @red-hat-developer-hub/backstage-plugin-konflux-common@0.1.3

## 0.1.2

### Patch Changes

- ebdd245: Move backend-only config (serviceAccountToken) into konflux-backend config.d.ts to avoid frontend/secret visibility conflicts during dynamic schema merge.
- Updated dependencies [ebdd245]
  - @red-hat-developer-hub/backstage-plugin-konflux-common@0.1.2

## 0.1.1

### Patch Changes

- 0d0e71f: First version of Konflux plugin (release workflow fixes)
- Updated dependencies [0d0e71f]
  - @red-hat-developer-hub/backstage-plugin-konflux-common@0.1.1

## 0.1.0

### Minor Changes

- fb96d45: First version of Konflux plugin

### Patch Changes

- f343e46: Updated dependency `@kubernetes/client-node` to `^0.22.0`.
- Updated dependencies [fb96d45]
  - @red-hat-developer-hub/backstage-plugin-konflux-common@0.1.0

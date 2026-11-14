# @red-hat-developer-hub/backstage-plugin-analytics-module-adoption-insights

## 1.2.0

### Minor Changes

- 206ff3f: Backstage version bump to v1.56.4

### Patch Changes

- 38e5ee0: Resolve Scaffolder time-saved estimates from catalog annotations, expose an aggregate Adoption Insights query, and include task runs and historical minutes saved in top template results with optional ranking by runs. Newly accepted events of every type use the authenticated user's identity for `user_ref`, regardless of a client-supplied `userName`. Historical Scaffolder create events already stored minutes when an estimate was present, but those values were supplied by clients; new values are resolved from the catalog. Event batches are validated before any catalog lookup or enqueue, oversized batches are rejected up front (configurable via `app.analytics.adoptionInsights.maxEventsPerRequest` with a positive integer; default 100), and repeated Template refs are resolved once per batch with bounded concurrency. Validation is now all-or-nothing per batch: if any event in a `POST /events` request is invalid the whole request is rejected and no events from it are stored, whereas previously valid events preceding the first invalid one could be persisted.

  Clarify in the analytics module README that `identityApi` is required and how user context and authenticated credentials are used when events are sent to the backend. The analytics module now logs and drops rejected event batches on HTTP 4xx responses, while retrying batches after network errors or HTTP 5xx responses.

## 1.1.1

## 1.1.0

### Minor Changes

- 0a42ebd: Bump minor after the release-2.1 cut so main patch versions do not collide with the maintenance line on npm.

## 1.0.4

## 1.0.3

## 1.0.2

## 1.0.1

## 1.0.0

### Major Changes

- b4476cf: **BREAKING:** Graduate NFS plugin exports from `/alpha` to the primary package entry point. OFS exports move to `/legacy`. Translations remain available at `/alpha`.

  NFS apps should import plugins from the package root instead of `/alpha`. Legacy OFS apps should import from `/legacy`.

### Minor Changes

- 8a42ace: Backstage version bump to v1.54.6

## 0.9.1

### Patch Changes

- d623d36: Refreshed `yarn.lock` to align resolved dependency versions.

## 0.9.0

### Minor Changes

- 8af2af2: Backstage version bump to v1.52.0

## 0.8.4

## 0.8.3

### Patch Changes

- 2465411: Replace Material UI v4 imports with MUI v5

## 0.8.2

## 0.8.1

### Patch Changes

- 5148408: Migrated to Jest 30 as required by @backstage/cli 0.36.0.

## 0.8.0

### Minor Changes

- 4526035: Backstage version bump to v1.49.3

## 0.7.1

## 0.7.0

### Minor Changes

- b58b43d: Migrated Adoption Insights and Adoption Insights Analytics Module to New Frontend System
- 0f66c7c: Backstage version bump to v1.47.3

## 0.6.2

## 0.6.1

### Patch Changes

- 3cf4c58: Mark the app-config `app.analytics.adoptionInsights` option as optional. It was already read with getOptional<Number/Boolean> so there is no code change or configuration change needed, this just reflect the status quo better.

## 0.6.0

### Minor Changes

- 77529c3: Backstage version bump to v1.45.2

## 0.5.0

### Minor Changes

- 44dd4f2: Backstage version bump to v1.44.2

## 0.4.1

## 0.3.0

### Minor Changes

- 6673ba3: Backstage version bump to v1.42.5

## 0.2.0

### Minor Changes

- 3a80c30: Backstage version bump to v1.39.1

## 0.1.0

### Minor Changes

- a66e0b0: Backstage version bump to v1.36.1

## 0.0.2

### Patch Changes

- 480aa8e: Release Adoption insights plugin

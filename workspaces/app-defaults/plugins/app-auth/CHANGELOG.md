# @red-hat-developer-hub/backstage-plugin-app-auth

## 0.1.1

### Patch Changes

- 7f30033: Pin `electron-to-chromium` to `1.5.349` via Yarn resolutions so hermetic Konflux/Hermeto builds do not float to freshly published versions that 404 on the cluster npm proxy.

## 0.1.0

### Minor Changes

- bf36f65: Backstage version bump to v1.52.1

### Patch Changes

- d7f7899: Make signInPage config optional and derive signInPage cards from configs defined under auth.providers

## 0.0.3

### Patch Changes

- c446456: Supports the upstream Keycloak and PingFederate auth providers in the sign-in page.

## 0.0.2

### Patch Changes

- 5148408: Migrated to Jest 30 as required by @backstage/cli 0.36.0.

## 0.0.1

### Patch Changes

- 43c25e2: # New auth and integration plugins for the new frontend system

  Introduces app-auth (sign-in + auth APIs) and app-integrations (default ScmAuth), migrated from RHDH’s old frontend wiring. Better misconfiguration errors for sign-in, less noisy test logs, ESLint fixes for pre-commit, and README updates.

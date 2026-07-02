# @red-hat-developer-hub/backstage-plugin-app-auth

## 0.0.4

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

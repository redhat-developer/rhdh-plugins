# Auth Providers Workspace

This workspace adds Keycloak and PingFederate authentication providers with RHDH-specific sign-in resolvers based on the upstream Backstage OIDC authentication provider. Works with new frontend system via `@red-hat-developer-hub/backstage-plugin-app-auth`.

## Plugins

### auth-backend-module-rhdh-oidc-provider

Provides OIDC-based authentication for Keycloak and PingFederate:

**Keycloak Provider**

- Default resolver: `oidcSubClaimMatchingKeycloakUserId`

**PingFederate Provider**

- Default resolver: `oidcLdapUuidMatchingAnnotation`

**Additional Resolvers**

- `preferredUsernameMatchingUserEntityName`
- `oidcSubClaimMatchingPingIdentityUserId`

## Usage

To start the app, run:

```sh
yarn install
yarn dev
```

To generate knip reports for this app, run:

```sh
yarn backstage-repo-tools knip-reports
```

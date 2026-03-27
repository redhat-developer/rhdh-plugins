# @red-hat-developer-hub/plugin-auth-backend-module-rhdh-oidc-provider

Backend authentication module providing Keycloak and PingFederate OIDC providers with RHDH-specific sign-in resolvers.

## Providers

- **Keycloak** (`auth.providers.keycloak`)
- **PingFederate** (`auth.providers.pingfederate`)

## Configuration

```yaml
auth:
  environment: development
  providers:
    keycloak:
      development:
        metadataUrl: ${KEYCLOAK_METADATA_URL}
        clientId: ${KEYCLOAK_CLIENT_ID}
        clientSecret: ${KEYCLOAK_CLIENT_SECRET}
        prompt: auto
        signIn: # Mandatory
          resolvers:
            - resolver: oidcSubClaimMatchingKeycloakUserId
    pingfederate:
      development:
        metadataUrl: ${PINGFEDERATE_METADATA_URL}
        clientId: ${PINGFEDERATE_CLIENT_ID}
        clientSecret: ${PINGFEDERATE_CLIENT_SECRET}
        prompt: auto
        signIn: # Mandatory
          resolvers:
            - resolver: oidcLdapUuidMatchingAnnotation
```

## Frontend Integration

Show providers on sign-in page (requires `@red-hat-developer-hub/backstage-plugin-app-auth`):

```yaml
signInPage: keycloak # or 'pingfederate', or ['keycloak', 'pingfederate']
```

## Available Resolvers

- `oidcSubClaimMatchingKeycloakUserId` — Keycloak default; maps `sub` claim to `userId` field in Keycloak user profile
- `oidcLdapUuidMatchingAnnotation` — PingFederate default; maps LDAP UUID claim to `backstage.io/ldap-uuid` annotation
- `oidcSubClaimMatchingPingIdentityUserId` — Maps `sub` claim to PingIdentity user ID
- `preferredUsernameMatchingUserEntityName` — Maps `preferred_username` to user entity name
- Standard Backstage resolvers: `emailMatchingUserEntityProfileEmail`, `emailLocalPartMatchingUserEntityName`

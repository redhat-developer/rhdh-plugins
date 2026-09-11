# DCM workspace

This workspace contains the DCM plugin and a full Backstage app + backend for local development, similar to the redhat-resource-optimization workspace.

## Structure

- **packages/app** – Full Backstage frontend (catalog, techdocs, search, scaffolder, DCM plugin).
- **packages/backend** – Full Backstage backend (catalog, auth, scaffolder, techdocs, search, DCM backend plugin).
- **plugins/dcm** – DCM frontend plugin.
- **plugins/dcm-backend** – DCM backend plugin.
- **plugins/dcm-common** – Shared code for DCM.

## Development

From the workspace root:

```sh
yarn install
yarn start
```

This runs the full app and backend concurrently (frontend at http://localhost:3000, backend at http://localhost:7007). You can then open the DCM page at http://localhost:3000/dcm.

### Other scripts

- **yarn start-app** – Start only the frontend app.
- **yarn start-backend** – Start only the backend.
- **yarn start:fe-plugin** – Start only the DCM frontend plugin in standalone mode.
- **yarn start:be-plugin** – Start only the DCM backend plugin in standalone mode.
- **yarn start:dev** – Run both plugins in standalone mode (no full app/backend).

Configuration is in `app-config.yaml`. Example catalog data is in `examples/`.

## Authentication

Set `dcm.auth.enabled` to match the DCM control plane's `auth.enabled` setting.

- When enabled, the DCM UI uses the signed-in user's OIDC access token. Configure
  an OIDC provider in RHDH `auth.providers`, including its metadata URL, client
  ID, and client secret. The proxy requires normal RHDH/Backstage credentials
  and the user token, then forwards that token to DCM as an upstream Bearer
  token.
- When disabled, the UI does not require an OIDC provider or send an upstream
  Bearer token. The proxy still requires normal RHDH/Backstage credentials, so
  the standalone and guest-only configurations use the guest session. DCM then
  applies its auth-disabled system actor rather than a per-user identity.

The standalone local configuration uses DCM auth-disabled mode. The proxy never
uses its shared `client_credentials` token for normal UI requests. Do not
configure or expose OIDC access tokens as static application configuration
values.

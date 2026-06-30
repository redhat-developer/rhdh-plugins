# backend

Backstage backend for the Boost workspace local dev shell.

## Boost plugin registration

`src/index.ts` registers all Boost backend packages:

- `@red-hat-developer-hub/backstage-plugin-boost-backend` (+ `boostAiProviderServiceFactory`)
- `@red-hat-developer-hub/backstage-plugin-boost-backend-module-llamastack`
- `@red-hat-developer-hub/backstage-plugin-boost-backend-module-kagenti`
- `@red-hat-developer-hub/backstage-plugin-llamastack-entity-provider`
- `@red-hat-developer-hub/backstage-plugin-kagenti-entity-provider`

Boost configuration is in the workspace root `app-config.yaml` under the `boost:` key. Override locally in `app-config.local.yaml` if needed.

## Development

From the workspace root:

```bash
yarn install   # once
yarn start     # starts app + backend together
```

The backend listens on port 7007 by default.

For catalog setup, auth providers, and other Backstage backend topics, see the [Backstage backend documentation](https://backstage.io/docs/backend-system/).

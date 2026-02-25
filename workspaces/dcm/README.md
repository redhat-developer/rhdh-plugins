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

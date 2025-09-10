# orchestrator-form-widgets

This Backstage frontend plugin provides default, but optional, set of RJSF form widgets for the Orchestrator workflow execution page as described in [extensibleForm.md](../../docs/extensibleForm.md).

Documentation of implemented widgets can be found in a [orchestratorFormWidgets.md](../../docs/orchestratorFormWidgets.md).

## Deployment

### Static (for development)

In the packages/app/src/App.tsx:

```
import { orchestratorFormWidgetsPlugin } from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-widgets';
...
const app = createApp({
    ...
    plugins: [orchestratorFormWidgetsPlugin],
})
```

### Dynamic (for RHDH production)

For RHDH production deployments, it is expected that the plugin is exported as a dynamic plugin using Janus CLI a loaded among the other dynamic frontend plugins.
No explicit configuration is needed.

## `http-workflow-dev-server` - HTTP server for dynamic widgets development

**For the development purposes only**, there is `http-workflow-dev-server`, very simple Express Node.js server which responds with JSON schema chunks for the `SchemaUpdater` and other active widgets.

Moreover, it does extensive logging of the received HTTP requests for debugging during the widget's development.

Refer to [http-workflow-dev-server](./http-workflow-dev-server/README.md) for more details.

## How to develop widgets

We do not have a dedicated developer Backstage instance to host dev environment for the widget library. We might add it in the future.

So far the development can be done via Orchestrator's dev instance (see `./workspaces/orchestrator/packages/backend` and `./workspaces/orchestrator/packages/frontend`).
This instance is already configured to statically load the widget library (see `createApp()` in `./workspaces/orchestrator/packages/app/src/App.tsx`).

To develop the widgets, we recommend to uncomment or further configure the `integrations:` and `auth:` sections in the `./workspaces/orchestrator/app-config.yaml` to be able to test various SCM Auth providers within `$${{}}` templates.

Please note, that the `proxy:` section is already pre-configured to match the `http-workflow-dev-server` listening on localhost.

Make sure your user has an entity in the Catalog and the authentication is otherwise configured so the tokens and user's profile info can be fetched by the workflow and `$${{identityApi.[various_keys]}}` templating.

- Once configured, do:

```bash
cd ./workspaces/orchestrator
yarn install
```

```bash
cd ./workspaces/orchestrator/plugins/orchestrator-form-widgets/http-workflow-dev-server
yarn update-running-workflow # which will copy the workflow under Backstage backend cache
```

Re-run the `yarn update-running-workflow` **whenever the example `dynamic.schema.sw` workflow is changed**.
Subsequently, delete the SonataFlow dev-container and restart the Backstage's backend process (as described in the next step).

- In one terminal:

```bash
# have docker/podman configured and running

# optional: docker rm --force `docker ps --all -q`

cd ./workspaces/orchestrator/packages/backend

export GITLAB_TOKEN=......
export GITHUB_TOKEN=......
export AUTH_GITHUB_CLIENT_ID=.......
export AUTH_GITHUB_CLIENT_SECRET=...........
export NOTIFICATIONS_BEARER_TOKEN=fooo
# export NODE_OPTIONS="${NODE_OPTIONS:-} --no-node-snapshot" # use with Node 20+

yarn start
```

- In second terminal:

```bash
cd ./workspaces/orchestrator/packages/app
yarn start
```

- In third terminal, run the HTTP test server:

```bash
cd ./workspaces/orchestrator/plugins/orchestrator-form-widgets/http-workflow-dev-server

yarn install
yarn start
```

### The dynamic_schema workflow

There is `dynamic_schema` workflow located under `http-workflow-dev-server/exampleWorkflows`.
Its purpose is to have a playground when developing the widgets.

The URLs referenced from this workflow's data input schema rely on proxy configured in the `./workspaces/orchestrator/app-config.yaml` which assumes the `http-workflow-dev-server` to be running.

This dev-only workflow is similar to https://github.com/rhdhorchestrator/backstage-orchestrator-workflows/blob/main/workflows/dynamic.schema.sw.json .
The difference is in the URLs used - the backstage-orchestrator-workflows' one references public GitHub HTTP server, so no extra steps in running the `http-workflow-dev-server` are needed.

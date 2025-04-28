# orchestrator-form-widgets

This Backstage frontend plugin provides default, but optional, set of RJSF form widgets for the Orchestrator workflow execution page.

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

For RHDH production deployments, it is expected that the plugin is exported as a dynamic plugin using janus CLI a loaded among the other dynamic frontend plugins.
No explicit configuration is needed.

## Content

The plugin provides implementation of `OrchestratorFormApi` (for `orchestratorFormApiRef`) to extend the Workflow execution form for custom provided ui:widgets.

## Context

## SchemaUpdater widget

A headless widget used for fetching snippets of JSON schema and dynamically updating the RJSF form JSON schema on the fly.

Example of use in workflow's input data schema:

```json
        "mySchemaUpdater": {
          "type": "string",
          "ui:widget": "SchemaUpdater",
          "ui:props": {
            "fetch:url": "https://service.providing/chunk01.json"
          }
        },
        "placeholderTwo": {
          "type": "string",
          "title": "This title is used until replaced by any SchemaUpdater"
        },
        "placeholderFour": {
          "ui:widget": "hidden"
        }
```

The provided chunks are expected to be JSON documents of `SchemaChunksResponse` structure.

Example of response:

```
{
  "placeholderTwo": {
    "type": "string",
    "title": "This is inputbox supplied by chunk02, replacing addition by chunk01 to the same placeholderTwo"
  },
  "placeholderFour": {
    "type": "string",
    "title": "This is ActiveTextInput ui:widget to test preservation of state on placeholderFour",
    "ui:widget": "ActiveTextInput"
  }
}
```

## HTTP Test Server

**For the development purposes only**, there is `http-test-server`, very simple Express Node.js server which responds with JSON schema chunks for the `SchemaUpdater` and other active widgets.

Moreover, it does extensive logging of the received HTTP requests for debugging during the widget's development.

Refer [http-test-server](./http-test-server/README.md) for more details.

## How to develop widgets

We do not have a dedicated developer Backstage instance to host dev environment for the widget library. We might add it in the future.

So far the development can be done via Orchestrator's dev instance (see `./workspaces/orchestrator/packages/backend` and `./workspaces/orchestrator/packages/frontend`).
This instance is already configured to statically load the widget library (see `createApp()` in `./workspaces/orchestrator/packages/app/src/App.tsx`).

To develop, we recommend to uncomment or farther configure the `integrations:` and `auth:` sections in the `./workspaces/orchestrator/app-config.yaml`.

Please note, that the `proxy:` section is already pre-configured to match the `http-test-server` listening on localhost.

Make sure your user has an entity in the Catalog and the authentication is otherwise configured so the tokens and user's profile info can be fetched by the workflow and `$${{}}` templating.

Once configured, do:

```bash
cd ./workspaces/orchestrator
yarn install
```

For the first-time or whenever the example workflow is changed:

```bash
cd ./workspaces/orchestrator/plugins/orchestrator-form-widgets/http-test-server
yarn update-running-workflow # which will copy the workflow under Backstage backend cache
```

In one terminal:

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

In second terminal:

```bash
cd ./workspaces/orchestrator/packages/app
yarn start
```

In third terminal, run the HTTP test server:

```bash
cd ./workspaces/orchestrator/plugins/orchestrator-form-widgets/http-test-server

yarn install
yarn start
```

### The dynamic_schema workflow

There is `dynamic_schema` workflow located under `http-test-server/exampleWorkflows`.
It's purpose is to have a playground when developing the widgets.

The URLs referenced from this workflow's data input schema rely on proxy configured in the `./workspaces/orchestrator/app-config.yaml` which assumes the `http-test-server` to be running.

This dev-only workflow is similar to https://github.com/rhdhorchestrator/backstage-orchestrator-workflows/blob/main/workflows/dynamic.schema.sw.json .
The difference is in the URLs used - the backstage-orchestrator-workflows' one references public Git Hub HTTP server, so no extra steps in running the `http-test-server` are needed.

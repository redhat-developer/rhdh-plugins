# orchestrator-form-widgets

This Backstage frontend plugin provides default, but optional, set of RJSF form widgets for the Orchestrator workflow execution page as described [here](../orchestrator-form-api/README.md).

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

Refer to [http-test-server](./http-test-server/README.md) for more details.

## How to develop widgets

We do not have a dedicated developer Backstage instance to host dev environment for the widget library. We might add it in the future.

So far the development can be done via Orchestrator's dev instance (see `./workspaces/orchestrator/packages/backend` and `./workspaces/orchestrator/packages/frontend`).
This instance is already configured to statically load the widget library (see `createApp()` in `./workspaces/orchestrator/packages/app/src/App.tsx`).

To develop the widgets, we recommend to uncomment or further configure the `integrations:` and `auth:` sections in the `./workspaces/orchestrator/app-config.yaml` to be able to test various SCM Auth providers within `$${{}}` templates.

Please note, that the `proxy:` section is already pre-configured to match the `http-test-server` listening on localhost.

Make sure your user has an entity in the Catalog and the authentication is otherwise configured so the tokens and user's profile info can be fetched by the workflow and `$${{identityApi.[various_keys]}}` templating.

- Once configured, do:

```bash
cd ./workspaces/orchestrator
yarn install
```

```bash
cd ./workspaces/orchestrator/plugins/orchestrator-form-widgets/http-test-server
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
cd ./workspaces/orchestrator/plugins/orchestrator-form-widgets/http-test-server

yarn install
yarn start
```

### The dynamic_schema workflow

There is `dynamic_schema` workflow located under `http-test-server/exampleWorkflows`.
Its purpose is to have a playground when developing the widgets.

The URLs referenced from this workflow's data input schema rely on proxy configured in the `./workspaces/orchestrator/app-config.yaml` which assumes the `http-test-server` to be running.

This dev-only workflow is similar to https://github.com/rhdhorchestrator/backstage-orchestrator-workflows/blob/main/workflows/dynamic.schema.sw.json .
The difference is in the URLs used - the backstage-orchestrator-workflows' one references public GitHub HTTP server, so no extra steps in running the `http-test-server` are needed.

## Development of a workflow using orchestrator-form-widgets

Developing workflows with `orchestrator-form-widgets` follows principles similar to standard workflow creation, with one critical enhancement: the ability to incorporate dynamic UI elements via the `ui:widget` property in your data input schema.

Key Differentiators:

- Dynamic UI Integration: Reference custom UI widgets directly in your schema using `ui:widget`, enabling interactive components like `ActiveTextInput` or `ActiveDropdown`.
- Backend Flexibility: A live HTTP server is required to:
  - Serve JSON Schema snippets for the SchemaUpdater.
  - Provide default data or option lists.
  - Handle complex validation logic for widgets.

Deployment Considerations:

- Use one or multiple servers depending on organizational needs.
- Ensure endpoint structures and response formats exactly match the naming conventions and data structures defined in your schema’s `ui:props` by the creator of workflow's `data input schema`.

TODO: describe components and provide snippets of code (based on the ADR).

### SchemaUpdater

TBD

### ActiveTextInput

TBD

### TBD: other sections - similar to the ADR

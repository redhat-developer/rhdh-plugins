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

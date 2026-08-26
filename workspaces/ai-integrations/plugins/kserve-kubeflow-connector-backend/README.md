# kserve-kubeflow-connector

A Backstage backend plugin that discovers KServe InferenceService resources on Kubernetes clusters and generates `AiModelServerAPI` catalog entities from them.

## Installation

This plugin is installed via the `@red-hat-developer-hub/backstage-plugin-kserve-kubeflow-connector-backend` package. To install it to your backend package, run the following command:

```bash
# From your root directory
yarn --cwd packages/backend add @red-hat-developer-hub/backstage-plugin-kserve-kubeflow-connector-backend
```

Then add the plugin to your backend in `packages/backend/src/index.ts`:

```ts
const backend = createBackend();
// ...
backend.add(
  import(
    '@red-hat-developer-hub/backstage-plugin-kserve-kubeflow-connector-backend'
  ),
);
```

## Supported `rhdh.io/` annotations

The plugin reads the following annotations from InferenceService resources to control how `AiModelServerAPI` entities are generated. Add these annotations to the `metadata.annotations` section of your InferenceService.

### `rhdh.io/system`

Sets the `spec.system` field on the generated entity, linking it to a Backstage System.

```yaml
metadata:
  annotations:
    rhdh.io/system: my-ai-platform
```

When absent, the entity has no `spec.system` field.

### `rhdh.io/serverType`

Overrides the `spec.serverType` field on the generated entity. Without this annotation the server type falls back to the API type (e.g. `openapi`, `grpc`).

```yaml
metadata:
  annotations:
    rhdh.io/serverType: openai-v1
```

### `rhdh.io/default`

Overrides which model is set as `spec.models.default` on the generated entity. The value is sanitized (whitespace stripped) before use. Without this annotation the default is the first model in the available list.

```yaml
metadata:
  annotations:
    rhdh.io/default: gpt-4
```

### `rhdh.io/model-*`

When one or more `rhdh.io/model-` prefixed annotations are present, the plugin creates a Model object for each annotation value instead of deriving a single model from the InferenceService name. The suffix after `model-` is a user-chosen key; the annotation value becomes the model name.

```yaml
metadata:
  annotations:
    rhdh.io/model-granite: ibm-granite-8b
    rhdh.io/model-llama: meta-llama-3
```

Without any `rhdh.io/model-*` annotations, a single model is created using the InferenceService namespace and name (e.g. `vllm-my-service`).

> **Note:** All four `rhdh.io/` control annotations are consumed during entity generation and are **not** propagated to the entity's `metadata.annotations`.

## Development

This plugin backend can be started in a standalone mode from directly in this
package with `yarn start`. It is a limited setup that is most convenient when
developing the plugin backend itself.

If you want to run the entire project, including the frontend, run `yarn start` from the root directory.

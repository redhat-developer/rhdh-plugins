# Extensible Workflow Execution Form

This capability enables developers to extend and customize the `react-jsonschema-form` workflow execution form component.
It is designed to enable developers to implement a Backstage plugin that provides a custom decorator for the workflow execution form.
This decorator supports overriding a selected set of [react-json-schema-form properties](https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/form-props) enabling the following features:

- **Custom Validations:** Extend default JSON schema validation with:
  - **Synchronous Validation** via the `customValidate` property.
  - **Asynchronous Validation** via the `getExtraErrors` property, for validations requiring backend calls.
- **Custom Components:** Replace default form components by overriding the `widgets` property.
- **Interdependent Field Values:** Manage complex inter-field dependencies using the `onChange` and `formData` properties.

The custom decorator is delivered via a factory method that leverages a [Backstage utility API](https://backstage.io/docs/api/utility-apis) provided by the orchestrator.
To trigger the desired behavior, the workflow schema should include custom UI properties.

For reference, an example plugin can be found [here](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/orchestrator/plugins/orchestrator-form-widgets).

## API

To implement the `orchestratorFormApiRef` API, include `@red-hat-developer-hub/backstage-plugin-orchestrator-form-api` package as a dependency.
This package provides the `OrchestratorFormApi` interface and other related types.

```typescript
export type FormDecoratorProps = Pick<
  FormProps<JsonObject, JSONSchema7, OrchestratorFormContextProps>,
  'formData' | 'formContext' | 'widgets' | 'onChange' | 'customValidate'
> & {
  getExtraErrors?: (
    formData: JsonObject,
    uiSchema: OrchestratorFormContextProps['uiSchema'],
  ) => Promise<ErrorSchema<JsonObject>> | undefined;
};
```

More info can be found [here](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/orchestrator/plugins/orchestrator-form-api/src/api.ts).

### Access to actual schema or form data by custom widgets

When implementing widgets or validators, actual UI schema or form data can be accessed via RJSF formContext:

```typescript
export const SchemaUpdater: Widget<
  JsonObject,
  JSONSchema7,
  OrchestratorFormContextProps
> = props => {
  const { formContext } = props;
  const formData = formContext?.formData;

  ...
};
```

### Example API Implementation

The most simple implementation of the API is the default one - adds no extra logic except passing the `formContext`.
See [its sources](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/orchestrator/plugins/orchestrator-form-api/src/DefaultFormApi.tsx).

More complex example is [the FormWidgetsApi provided by orchestrator-form-widgets plugin](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/orchestrator/plugins/orchestrator-form-widgets/src/FormWidgetsApi.tsx).

### Plugin Creation Example

```typescript
export const formApiFactory = createApiFactory({
  api: orchestratorFormApiRef,
  deps: {},
  factory() {
    return new CustomFormApi();
  },
});

export const testFactoryPlugin = createPlugin({
  id: 'custom-form-plugin',
  apis: [formApiFactory],
});
```

### Schema example

For a schema example referencing custom `ui:widgets`, look [here](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/orchestrator/plugins/orchestrator-form-widgets/http-workflow-dev-server/exampleWorkflows/schemas/dynamic-course-select__main-schema.json)

Instructions how to set the whole environment to run that example workflow, are listed [here](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/orchestrator/plugins/orchestrator-form-widgets/README.md).

### Dynamic plugin configuration

The `orchestrator-form-widgets` plugin does not require any additional configuration when deployed as an RHDH dynamic plugin:

```yaml
pluginConfig:
  dynamicPlugins:
    frontend:
      red-hat-developer-hub.backstage-plugin-orchestrator-form-widgets: {}
```

See `scalprum` config in the [package.json](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/orchestrator/plugins/orchestrator-form-widgets/package.json).

### Referencing the custom behavior in the schema

The workflow execution schema adheres to the [json-schema](https://json-schema.org/) format, which allows for extending the schema with custom properties beyond the official specification.

This flexibility enables the inclusion of additional [uiSchema](https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/uiSchema/) fields directly within the schema, as demonstrated in the example above.

### How It All Comes Together

The `orchestrator-form-react` plugin implements the form component for workflow execution.
It integrates with the custom API provided by the developer's plugin to generate and customize the form.
The `orchestrator` plugin then incorporates this form into the workflow execution page.

The `orchestrator-form-react` plugin handles the following key tasks:

- **Generating the UI Schema:** It extracts custom UI schema fields from the main schema, automatically generates the [uiSchema](https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/uiSchema/), and passes it to the `react-jsonschema-form` component, enabling advanced UI customizations.

- **Organizing Forms into Wizard-Style Steps:** If the schema is an object containing nested objects (i.e., the root is an object, and its properties are also objects), the plugin organizes the form into multiple steps. Each nested object becomes a separate step in a wizard-style interface. For example, the schema provided above results in two steps: _Personal Details_ and _Contact Details_.

The [`orchestrator-form-react`](https://github.com/janus-idp/backstage-plugins/tree/main/plugins/orchestrator-form-react) plugin is designed to operate independently of the main orchestrator plugin. This modularity allows developers to test and validate form behavior in a standalone Backstage development environment before integrating it with the full orchestrator setup.

To use this plugin, add the `@red-hat-developer-hub/backstage-plugin-orchestrator-form-react` package as a dependency in your project.

## Example implementation

Example implementation of the API is the [orchestrator-form-widgets](https://github.com/redhat-developer/rhdh-plugins/tree/main/workspaces/orchestrator/plugins/orchestrator-form-widgets) which documentation can be found in [extensibleForm.md](./extensibleForm).

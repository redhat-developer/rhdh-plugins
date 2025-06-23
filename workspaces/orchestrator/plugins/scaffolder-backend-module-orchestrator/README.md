# backstage-plugin-scaffolder-backend-module-orchestrator

The Orchestrator module [@backstage/plugin-scaffolder-backend](https://www.npmjs.com/package/@backstage/plugin-scaffolder-backend) provides actions callable from the [Backstage templates](https://backstage.io/docs/features/software-templates/).

An example of using these actions can be found in the `workspaces/orchestrator/entities/convertWorkflowToTemplate.yaml` template.

## Installation

### Static Plugin Installation

In `packages/backend/src/index.ts`:

```ts
backend.add(
  import(
    '@red-hat-developer-hub/backstage-plugin-scaffolder-backend-module-orchestrator'
  ),
);
```

## convertWorkflowToTemplate: A Software Template for Converting Workflows into Templates

The `workspaces/orchestrator/entities/convertWorkflowToTemplate.yaml` scaffolder software template is used for generating templates to be used to execute a serverless workflow via the Orchestrator.

The generated template is a yaml document which is pushed to a GitHub repository for later consumption by the Backstage.

The only specific input parameter is the `workflowId` of the desired workflow.

The rest of parameters cover details about the target GitHub repository to either create a new repo or push a PR to an existing one.

The generated yaml template is accompanied by a README file highlighting instructions how to register the new template in the Backstage catalog.

**Important Note on Template Input Structure:**

The structure of the template input differs from that of the page used for collecting input parameters for workflows, despite some similarities. These two pages are supported by distinct implementations. While the set of parameters should remain consistent, their visual representation and especially grouping into steps may vary.

## What is a workflow ID

The `[workflowId]` matches the identifier from the workflow definition.
For example, in the [workflow definition](https://github.com/rhdhorchestrator/serverless-workflows/blob/main/workflows/greeting/greeting.sw.yaml) below, the identifier is `greeting`:

```yaml
id: greeting
version: '1.0'
specVersion: '0.8'
name: Greeting workflow
description: YAML based greeting workflow
annotations:
  - 'workflow-type/infrastructure'
dataInputSchema: 'schemas/greeting.sw.input-schema.json'
extensions:
  - extensionid: workflow-output-schema
    outputSchema: schemas/workflow-output-schema.json
```

## Available Actions

### Action: `orchestrator:workflow:run`

Runs a SonataFlow workflow from a Software Template.

**Input:**

- `workflow_id` (string, required): The workflow ID from the definition.
- `parameters` (object, required): Input parameters for the workflow.

**Dry Run:** Supported — logs the event without executing the call.

**Example:**

```yaml
steps:
  - id: runWorkflow
    name: Run workflow
    action: orchestrator:workflow:run
    input:
      workflow_id: yamlgreet
      parameters: ${{ parameters }}
```

---

### Action: `orchestrator:workflow:get_params`

Retrieves metadata and input schema from a SonataFlow workflow.

**Input:**

- `workflow_id` (string, required): The workflow ID.
- `indent` (number, optional): Indentation level for the resulting YAML.

**Output:**

- `title`
- `description`
- `parameters`

**Dry Run:** Not supported.

---

## GitHub integration

The `convertWorkflowToTemplate.yaml` template pushes the result into a GitHub repository.
To make it work, the [Backstage integration with GitHub](https://backstage.io/docs/integrations/github/locations) needs to be properly set.

In a nutshell:

- add `@backstage/plugin-scaffolder-backend-module-github` to your `backend` application, sort of:

```bash
yarn --cwd packages/backend add @backstage/plugin-scaffolder-backend-module-github
```

- in `packages/backend/src/index.ts`:

```
backend.add(import('@backstage/plugin-scaffolder-backend-module-github'));
```

- generate GitHub access token, e.g. via https://github.com/settings/personal-access-tokens and set

```bash
export GITHUB_TOKEN=.......
```

- configure `app-config.yaml`:

  ```yaml
  integrations:
    github:
      - token: ${GITHUB_TOKEN}
  ```

---

## Hints

- When using **Node.js 20+**, add this environment variable **before** running the backend:

  ```bash
  export NODE_OPTIONS="${NODE_OPTIONS:-} --no-node-snapshot"
  ```

  [Reference from Backstage documentation](https://backstage.io/docs/features/software-templates/#getting-started)

---

## Resources

- [Backstage Template Actions Documentation](https://backstage.io/docs/features/software-templates/builtin-actions)

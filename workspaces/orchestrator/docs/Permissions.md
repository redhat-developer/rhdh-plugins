The Orchestrator plugin protects its backend endpoints with the builtin permission mechanism and combines it with
the RBAC plugin. The result is control over what users can see or execute.

## Orchestrator Permissions

| Name                                     | Resource Type  | Policy | Description                                                                                    | Requirements |
| ---------------------------------------- | -------------- | ------ | ---------------------------------------------------------------------------------------------- | ------------ |
| orchestrator.workflow                    | named resource | read   | Allows the user to list and read any workflow definition and their instances that they created |              |
| orchestrator.workflow.[`workflowId`]     | named resource | read   | Allows the user to list and read a _single_ workflow definition and its instances that they created                 |              |
| orchestrator.workflow.use                | named resource | update | Allows the user to run or abort _any_ workflow                                                 |              |
| orchestrator.workflow.use.[`workflowId`] | named resource | update | Allows the user to run or abort the _single_ workflow                                          |              |
| orchestrator.workflowAdminView           | named resource | read   | Allows the user to view instance variables and workflow definition editor                      |              |
| orchestrator.instanceAdminView           | named resource | read   | Allows the user to view all workflow instances, including those not created by them            |              |

The user is permitted to do an action if either the generic permission or the specific one allows it.
In other words, it is not possible to grant generic `orchestrator.workflow` and then selectively disable it for a specific workflow via `orchestrator.workflow.use.[workflowId]` with `deny`.

The `[workflowId]` matches the identifier from the workflow definition.
For example, in the [workflow definition](https://github.com/rhdhorchestrator/serverless-workflows/blob/main/workflows/greeting/greeting.sw.yaml) below, the identifier is `greeting`:

```yaml greeting.sw.yaml
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

## Policy File

To get started with policies, we recommend defining 2 roles and assigning them to groups or users.

As an example, mind the following [policy file](./rbac-policy.csv).

Since the `guest` user has the `default/workflowUser` role, it can:

- list subset of workflows (specific `orchestrator.workflow.yamlgreet`)
- view workflow details and their instances of selected workflow (`orchestrator.workflow.yamlgreet`)
- execute or abort the `yamlgreet` and `wait-or-error` workflows but not any other (`orchestrator.workflow.use.yamlgreet`)

Namely, the `default/workflowUser` role can not see the list of _all_ workflows or execute other workflows than explicitly stated.

The users of the `default/workflowAdmin` role have full permissions (can list, read and execute any workflow).

```csv
p, role:default/workflowUser, orchestrator.workflow.yamlgreet, read, allow
p, role:default/workflowUser, orchestrator.workflow.wait-or-error, read, allow

p, role:default/workflowUser, orchestrator.workflow.use.yamlgreet, update, allow

p, role:default/workflowAdmin, orchestrator.workflow, read, allow
p, role:default/workflowAdmin, orchestrator.workflow.use, update, allow

g, user:development/guest, role:default/workflowUser
g, user:default/mareklibra, role:default/workflowAdmin
```

See https://casbin.org/docs/rbac for more information about casbin rules.

## Enable permissions

To enable permissions, you need to add the following in the [app-config file](../app-config.yaml):

```
permission:
  enabled: true
  rbac:
    policies-csv-file: <absolute path to the policy file>
    pluginsWithPermission:
      - orchestrator
    policyFileReload: true
    admin:
      users:
        - name: user:default/YOUR_USER
```

## Limitations

The RBAC UI recently expects all permissions to be statically listed at the application start-up time.

The Orchestrator specific permissions (those with the `workflowId` in their name) are dynamically created and so the RBAC UI can not be used for their management.
It is recommended to use either the policy CSV file or the RBAC API for their management instead.

The generic permissions (means the `orchestrator.workflow` and `orchestrator.workflow.use`) are statically defined and so work fine within the RBAC UI.

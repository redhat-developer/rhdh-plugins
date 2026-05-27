## BREAKING CHANGE - Conditional Policies Required

**As of orchestrator plugin version 2.1.0**, the following permissions are **NO LONGER SUPPORTED**:

- `orchestrator.workflow.<workflowId>` (e.g., `orchestrator.workflow.yamlgreet`)
- `orchestrator.workflow.use.<workflowId>` (e.g., `orchestrator.workflow.use.checkout`)

You **MUST** migrate to conditional policies using the `IS_ALLOWED_WORKFLOW_ID` rule. See the [Migration Guide](MIGRATION-CONDITIONAL-POLICIES.md) for detailed instructions.

---

The Orchestrator plugin protects its backend endpoints with the builtin permission mechanism and combines it with
the RBAC plugin. The result is control over what users can see or execute.

## Orchestrator Permissions

| Name                           | Resource Type         | Policy | Description                                                                                                                                                        | Requirements |
| ------------------------------ | --------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| orchestrator.workflow          | orchestrator-workflow | read   | Allows the user to list and read workflow definitions and their instances. Use conditional policies with IS_ALLOWED_WORKFLOW_ID to restrict to specific workflows. |              |
| orchestrator.workflow.use      | orchestrator-workflow | update | Allows the user to run or abort workflows. Use conditional policies with IS_ALLOWED_WORKFLOW_ID to restrict to specific workflows.                                 |              |
| orchestrator.workflowAdminView | basic                 | read   | Allows the user to view instance variables and workflow definition editor                                                                                          |              |
| orchestrator.instanceAdminView | basic                 | read   | Allows the user to view all workflow instances, including those not created by them                                                                                |              |

## Using Conditional Policies

To restrict workflow access to specific workflows, you must use conditional policies with the `IS_ALLOWED_WORKFLOW_ID` rule.

**IMPORTANT:** Conditional policies are created via the RBAC REST API, not in CSV files. The CSV file contains only basic permissions.

### Rule Parameters

- **Rule name:** `IS_ALLOWED_WORKFLOW_ID`
- **Resource type:** `orchestrator-workflow`
- **Plugin ID:** `orchestrator`
- **Parameter:** `workflowIds` (array of workflow IDs)

### Step 1: Add Basic Permission to CSV

First, add the basic permission to your `rbac-policy.csv`:

```csv
p, role:default/developer, orchestrator.workflow, read, allow
p, role:default/developer, orchestrator.workflow.use, update, allow
```

### Step 2: Create Conditional Policy via REST API

Then create the conditional policy using the RBAC REST API to restrict access to specific workflows.

**Example: Restrict read access to specific workflows**

```bash
curl -X POST https://your-backstage-url/api/permission/roles/conditions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "result": "CONDITIONAL",
    "roleEntityRef": "role:default/developer",
    "pluginId": "orchestrator",
    "resourceType": "orchestrator-workflow",
    "permissionMapping": ["read"],
    "conditions": {
      "rule": "IS_ALLOWED_WORKFLOW_ID",
      "resourceType": "orchestrator-workflow",
      "params": {
        "workflowIds": ["yamlgreet", "checkout"]
      }
    }
  }'
```

**Example: Restrict execute access to specific workflows**

```bash
curl -X POST https://your-backstage-url/api/permission/roles/conditions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "result": "CONDITIONAL",
    "roleEntityRef": "role:default/developer",
    "pluginId": "orchestrator",
    "resourceType": "orchestrator-workflow",
    "permissionMapping": ["update"],
    "conditions": {
      "rule": "IS_ALLOWED_WORKFLOW_ID",
      "resourceType": "orchestrator-workflow",
      "params": {
        "workflowIds": ["yamlgreet"]
      }
    }
  }'
```

### Full Access (No Conditional Policy Needed)

To grant access to ALL workflows, add only the basic permission to CSV (no REST API call needed):

```csv
p, role:default/admin, orchestrator.workflow, read, allow
p, role:default/admin, orchestrator.workflow.use, update, allow
```

### Viewing Conditional Policies

To view all configured conditional policies:

```bash
curl -X GET https://your-backstage-url/api/permission/roles/conditions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

For more details, see the [RBAC Conditional Policies documentation](https://github.com/backstage/community-plugins/tree/main/workspaces/rbac/plugins/rbac-backend/docs/conditions.md).

## Policy File

To get started with policies, we recommend defining 2 roles and assigning them to groups or users.

As an example, mind the following [policy file](./rbac-policy.csv).

**IMPORTANT:** The CSV file contains ONLY basic permissions. Conditional policies (workflow-specific access) must be created via the REST API (see above).

The users of the `default/workflowAdmin` role have full permissions (can list, read and execute any workflow).

The `guest` user has the `default/workflowUser` role with basic permissions. To restrict this role to specific workflows, create conditional policies via the REST API.

```csv
# WorkflowUser role - basic permissions (add conditional policies via REST API for workflow-specific access)
p, role:default/workflowUser, orchestrator.workflow, read, allow
p, role:default/workflowUser, orchestrator.workflow.use, update, allow

# WorkflowAdmin role - full access to all workflows (no conditional policies needed)
p, role:default/workflowAdmin, orchestrator.workflow, read, allow
p, role:default/workflowAdmin, orchestrator.workflow.use, update, allow

g, user:development/guest, role:default/workflowUser
g, user:default/mareklibra, role:default/workflowAdmin
```

**To restrict `role:default/workflowUser` to specific workflows**, create conditional policies via REST API:

```bash
# Restrict read access to specific workflows
curl -X POST https://your-backstage-url/api/permission/roles/conditions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "result": "CONDITIONAL",
    "roleEntityRef": "role:default/workflowUser",
    "pluginId": "orchestrator",
    "resourceType": "orchestrator-workflow",
    "permissionMapping": ["read"],
    "conditions": {
      "rule": "IS_ALLOWED_WORKFLOW_ID",
      "resourceType": "orchestrator-workflow",
      "params": {
        "workflowIds": ["yamlgreet", "wait-or-error"]
      }
    }
  }'

# Restrict execute access to specific workflows
curl -X POST https://your-backstage-url/api/permission/roles/conditions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "result": "CONDITIONAL",
    "roleEntityRef": "role:default/workflowUser",
    "pluginId": "orchestrator",
    "resourceType": "orchestrator-workflow",
    "permissionMapping": ["update"],
    "conditions": {
      "rule": "IS_ALLOWED_WORKFLOW_ID",
      "resourceType": "orchestrator-workflow",
      "params": {
        "workflowIds": ["yamlgreet"]
      }
    }
  }'
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

## Managing Conditional Policies via REST API

### List all conditional policies

```bash
curl -X GET https://your-backstage-url/api/permission/roles/conditions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get conditional policy by ID

```bash
curl -X GET https://your-backstage-url/api/permission/roles/conditions/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update conditional policy

```bash
curl -X PUT https://your-backstage-url/api/permission/roles/conditions/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "result": "CONDITIONAL",
    "roleEntityRef": "role:default/developer",
    "pluginId": "orchestrator",
    "resourceType": "orchestrator-workflow",
    "permissionMapping": ["read"],
    "conditions": {
      "rule": "IS_ALLOWED_WORKFLOW_ID",
      "resourceType": "orchestrator-workflow",
      "params": {
        "workflowIds": ["yamlgreet", "newflow"]
      }
    }
  }'
```

### Delete conditional policy

```bash
curl -X DELETE https://your-backstage-url/api/permission/roles/conditions/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Workflow Identifier

The `workflowId` in conditional policies matches the identifier from the workflow definition.
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

## RBAC UI Compatibility

The orchestrator permissions (`orchestrator.workflow` and `orchestrator.workflow.use`) are statically defined and work fine within the RBAC UI. Conditional policies must be managed via the REST API as shown above.

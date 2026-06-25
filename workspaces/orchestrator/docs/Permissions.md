## DEPRECATION NOTICE - Dynamic Permissions

**Dynamic workflow-specific permissions are deprecated and will be removed in the next release.** They continue to work in this release alongside the new conditional policies, but you should migrate now.

The following dynamic permissions are **DEPRECATED**:

- `orchestrator.workflow.<workflowId>` (e.g., `orchestrator.workflow.yamlgreet`)
- `orchestrator.workflow.use.<workflowId>` (e.g., `orchestrator.workflow.use.checkout`)

**Replace them with conditional policies** using the `IS_ALLOWED_WORKFLOW_ID` rule. See the [Migration Guide](MIGRATION-CONDITIONAL-POLICIES.md) for detailed instructions.

### Important notes about dynamic permissions

- Dynamic permissions could **only** be created via **CSV permission policy files** or the **REST API**. The RBAC UI does not support creating or displaying them.
- If you created dynamic permissions via the REST API, you must **delete them via the REST API** and replace them with conditional policies.
- Both systems (dynamic permissions and conditional policies) work simultaneously in this release. If either grants access, the user gets access.
- A deprecation warning is logged when access is granted through a dynamic permission.

---

The Orchestrator plugin protects its backend endpoints with the builtin permission mechanism and combines it with
the RBAC plugin. The result is control over what users can see or execute.

## Orchestrator Permissions

| Name                                     | Resource Type         | Policy | Description                                                                                                                                                        | Status         |
| ---------------------------------------- | --------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| orchestrator.workflow                    | orchestrator-workflow | read   | Allows the user to list and read workflow definitions and their instances. Use conditional policies with IS_ALLOWED_WORKFLOW_ID to restrict to specific workflows. |                |
| orchestrator.workflow.use                | orchestrator-workflow | update | Allows the user to run or abort workflows. Use conditional policies with IS_ALLOWED_WORKFLOW_ID to restrict to specific workflows.                                 |                |
| orchestrator.workflow.\<workflowId\>     | basic                 | read   | Allows read access to a specific workflow. Can only be created via CSV policy files or REST API.                                                                   | **DEPRECATED** |
| orchestrator.workflow.use.\<workflowId\> | basic                 | update | Allows execute/abort access to a specific workflow. Can only be created via CSV policy files or REST API.                                                          | **DEPRECATED** |
| orchestrator.workflowAdminView           | basic                 | read   | Allows the user to view instance variables and workflow definition editor                                                                                          |                |
| orchestrator.instanceAdminView           | basic                 | read   | Allows the user to view all workflow instances, including those not created by them                                                                                |                |

## Define basic static permissions(Full access by RBAC roles)

To get started with policies, we recommend defining 2 roles and assigning them to groups or users.

As an example, mind the following [policy file](./rbac-policy.csv).

**IMPORTANT:** The CSV file contains basic permissions with full access for the RBAC role. To restrict access to specific workflow resources, use conditional policies (recommended). Don't use deprecated dynamic permissions.

The users of the `default/workflowAdmin` role have full permissions (can list, read and execute any workflow).

The `guest` user has the `default/workflowUser` role with basic permissions. To restrict this role to specific workflows, use conditional policies.

```csv
# WorkflowUser role - basic permissions (add conditional policies for workflow-specific access)
p, role:default/workflowUser, orchestrator.workflow, read, allow
p, role:default/workflowUser, orchestrator.workflow.use, update, allow

# WorkflowAdmin role - full access to all workflows (no conditional policies needed)
p, role:default/workflowAdmin, orchestrator.workflow, read, allow
p, role:default/workflowAdmin, orchestrator.workflow.use, update, allow

g, user:development/guest, role:default/workflowUser
g, user:default/mareklibra, role:default/workflowAdmin
```

### DEPRECATED: Dynamic permissions in CSV files

The following CSV format still works in this release but is **deprecated** and will be removed in the next release:

```csv
# DEPRECATED - use conditional policies instead
p, role:default/workflowUser, orchestrator.workflow.yamlgreet, read, allow
p, role:default/workflowUser, orchestrator.workflow.use.yamlgreet, update, allow
```

Replace with conditional policies (see below).

**To restrict `role:default/workflowUser` to specific workflows**, create additional conditional policies file.

## Using Conditional Policies

To restrict workflow access to specific workflows, you must use conditional policies with the `IS_ALLOWED_WORKFLOW_ID` rule.

**IMPORTANT:** Conditional policies are created via the RBAC UI or the RBAC REST API or separated conditional policies file, not in CSV files. The CSV file contains only basic permissions and role members definition.

### Rule Parameters

- **Rule name:** `IS_ALLOWED_WORKFLOW_ID`
- **Resource type:** `orchestrator-workflow`
- **Plugin ID:** `orchestrator`
- **Parameter:** `workflowIds` (array of workflow IDs)

### Option 1: Add permission policies files to define RBAC role and conditional policies

First, add the role members difinitions to your `rbac-policy.csv`:

```csv
g, user:default/some-user, role:default/developer
g, group:default/some-user-group, role:default/developer
```

Define conditional policies in the yaml file:

```yaml
result: CONDITIONAL
pluginId: orchestrator
resourceType: orchestrator-workflow
conditions:
  rule: IS_ALLOWED_WORKFLOW_ID
  resourceType: orchestrator-workflow
  params:
    workflowIds:
      - hello_world
      - gh-pr
roleEntityRef: 'role:default/developer'
permissionMapping:
  - read
  - update
```

Provide conditional policies file path and csv file path in the application plugin configuration:

```
permission:
  enabled: true
  rbac:
    # Permission policy file with role members definition and basic RBAC permissions
    policies-csv-file: ../../docs/rbac-policy.csv
    # Conditional policies file.
    conditionalPoliciesFile: ../../docs/conditional-policies.yaml
    # policyFileReload: true # Optional permissions hot reload
    pluginsWithPermission:
      - orchestrator
    admin:
      users:
        - name: user:development/some-admin
```

Notice: conditional policies from yaml file depends on role members definition in the csv file.

### Option 2: Create Conditional Policy with help of RBAC UI

Create conditional policies via RBAC UI:

1. Navigate to your Backstage RBAC Administration page
2. Select the role you want to configure (e.g., `role:default/developer`) from the list
3. Click role name link
4. Take a look permissions table and click "Edit" button
5. Expand list plugins and select "Orchestator" plugin
6. Select permissions `orchestrator.workflow`(with "read" action) or `orchestrator.workflow.use`(with "use" action)
7. Click conditional button at the end of the permission row - "Configure access" dialog should appear
8. Select condition with rule "IS_ALLOWED_WORKFLOW_ID"
9. Type list workflow ids separated by comma
10. Click "Save button" and close dialog
11. Add more conditional policies if needed(repeat steps 6-10)
12. Click "Next" and "Save" button to complete role edition

### Option 3: Create Conditional Policy via REST API

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

Alternatively you can use RBAC UI.

### Viewing Conditional Policies

Use RBAC UI to view conditional policies.

Additionally to view all configured conditional policies:

```bash
curl -X GET https://your-backstage-url/api/permission/roles/conditions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

For more details, see the [RBAC Conditional Policies documentation](https://github.com/backstage/community-plugins/tree/main/workspaces/rbac/plugins/rbac-backend/docs/conditions.md).

## Enable permissions

To enable permissions, you need to add the following in the [app-config file](../app-config.yaml):

```
permission:
  enabled: true
  rbac:
    policies-csv-file: <absolute path to the policy file>
    # Permission policy file with role members definition and basic RBAC permissions
    policies-csv-file: <absolute path to the policy file>
    # Conditional policies file
    conditionalPoliciesFile: <absolute path to the conditional policy file>
    # policyFileReload: true # Optional permissions hot reload
    pluginsWithPermission:
      - orchestrator
    policyFileReload: true
    admin:
      users:
        - name: user:default/YOUR_USER
```

Notice: This is good practice to use permission policy files to define permissions in a declarative way. However, alternatively, you can use the RBAC UI to create roles and permissions and omit permission policy files from the configuration. You can also define permissions using both options: policy files and the RBAC UI.

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

The orchestrator permissions (`orchestrator.workflow` and `orchestrator.workflow.use`) are statically defined and work within the RBAC UI. Conditional policies can be created and managed via the RBAC UI, REST API, or conditional policies YAML files.

**Note:** The deprecated dynamic permissions (`orchestrator.workflow.<workflowId>`, `orchestrator.workflow.use.<workflowId>`) are **not visible** in the RBAC UI. The UI does not support creating or displaying them. If you created them via REST API, you must delete them via REST API and replace with conditional policies.

# Migration Guide: Dynamic Workflow Permissions to Conditional Policies

## Deprecation Notice

**As of orchestrator plugin version 2.1.0**, the following dynamic permissions are **DEPRECATED**:

- `orchestrator.workflow.<workflowId>` (e.g., `orchestrator.workflow.yamlgreet`)
- `orchestrator.workflow.use.<workflowId>` (e.g., `orchestrator.workflow.use.checkout`)

These permissions **still work** in this release alongside the new conditional policies. However, they **will be removed in the next release**. You should migrate to conditional policies using the `IS_ALLOWED_WORKFLOW_ID` rule.

**Impact:** In this release, both systems work simultaneously — if either dynamic permissions or conditional policies grant access, the user gets access. A deprecation warning is logged when access is granted through a dynamic permission. In the **next release**, dynamic permissions will be removed entirely.

## Overview

### What Changed and Why

**Before:** The orchestrator plugin used dynamic permissions created per workflow:

- `orchestrator.workflow.<workflowId>` for read access
- `orchestrator.workflow.use.<workflowId>` for execute access

**These dynamic permissions could only be created via CSV permission policy files or REST API.** The RBAC UI does not support creating or displaying them.

**Now (recommended):** Use generic resource permissions with conditional policies:

- `orchestrator.workflow` for read access (all workflows or restricted via conditional policies)
- `orchestrator.workflow.use` for execute access (all workflows or restricted via conditional policies)

**Why this change:**

- Improved performance - conditional policies are evaluated once per request instead of checking permissions for each workflow individually
- Better alignment with Backstage RBAC architecture
- Full compatibility with RBAC UI (which supports conditional policies but not dynamic permissions)
- Cleaner, more maintainable authorization code

### Who Needs to Migrate

You should migrate if:

- Your `rbac-policy.csv` file contains permissions like `orchestrator.workflow.<workflowId>` or `orchestrator.workflow.use.<workflowId>`
- You created dynamic permissions via REST API using deprecated permission names
- Your users currently have per-workflow access (not full access to all workflows)

You do NOT need to migrate if:

- You only use generic permissions (`orchestrator.workflow`, `orchestrator.workflow.use`) with no workflow-specific restrictions
- All your users have full access to all workflows

## What Is Deprecated

### Dynamic Permissions Still Work (For Now)

These permission patterns still work in this release but are **deprecated**:

```csv
# DEPRECATED - still works but will be removed in the next release
p, role:default/user, orchestrator.workflow.yamlgreet, read, allow
p, role:default/user, orchestrator.workflow.use.checkout, update, allow
p, role:default/developer, orchestrator.workflow.approval, read, allow
```

**In the next release:** These permissions will stop working entirely. Users with only these permissions will see an empty workflow list and get "403 Forbidden" errors.

### Dynamic Permissions Created via REST API

If you created dynamic permissions via the REST API, you must:

1. **Delete** the dynamic permissions via REST API
2. **Create** conditional policies to replace them (via RBAC UI, REST API, or YAML files)

The RBAC UI cannot display or manage dynamic permissions, so REST API is the only way to remove them.

### No Automatic Migration

There is **no automatic migration**. The plugin does not convert deprecated permissions to conditional policies. You must manually create the new configuration.

## New Authorization Model

### How Conditional Policies Work

Conditional policies restric user access to the resources with help of conditional rules and parameters.

**Conditional Policy (YAML file or RBAC UI)**

- Create conditions via YAML configuration file or RBAC UI
- Specify which workflows the role can access
- Uses `IS_ALLOWED_WORKFLOW_ID` rule with `workflowIds` parameter

You can choose either approach for defining conditional policies:

- **YAML file**: Static configuration committed to source control and stored in database once file defined in the rbac configuration
- **RBAC plugin UI**: Dynamic configuration stored in database
- **REST API**: Dynamic configuration stored in database

### The IS_ALLOWED_WORKFLOW_ID Rule

**Rule parameters:**

- **Rule name:** `IS_ALLOWED_WORKFLOW_ID`
- **Resource type:** `orchestrator-workflow`
- **Plugin ID:** `orchestrator`
- **Parameter:** `workflowIds` - array of workflow IDs to grant access to

**Example conditional policy in yaml format:**

This conditional policy allows members of the role role:default/hello-world-role to read and execute workflow with id 'hello_world':

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
roleEntityRef: 'role:default/hello-world-role'
permissionMapping:
  - read
  - update
```

## Migration Steps

### Step 1: Inventory Existing Permissions

#### Find deprecated permissions in CSV file

Search your policy CSV file for deprecated permission patterns:

```bash
grep "orchestrator.workflow\." /path/to/rbac-policy.csv
```

Look for patterns like:

- `orchestrator.workflow.yamlgreet`
- `orchestrator.workflow.use.checkout`
- Any permission with `orchestrator.workflow` followed by a dot and workflow ID

**Example deprecated entries:**

```csv
p, role:default/developer, orchestrator.workflow.yamlgreet, read, allow
p, role:default/developer, orchestrator.workflow.checkout, read, allow
p, role:default/developer, orchestrator.workflow.use.yamlgreet, update, allow
```

**What to extract:**

- Role name (e.g., `role:default/developer`)
- Workflow IDs (e.g., `yamlgreet`, `checkout`)
- Permission action (read or execute)

#### Check list created policies

List all policies for a specific role:

```bash
curl -X GET "https://your-backstage-url/api/permission/policies/role:default/developer" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Look for policies with deprecated permission names in the response.

#### List existing conditional policies

Check if you already have any conditional policies:

```bash
curl -X GET https://your-backstage-url/api/permission/roles/conditions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 2: Migrate to Conditional Policies

Replace deprecated per-workflow permissions with conditional policies in a separate YAML file (or via RBAC UI/REST API).

**Migration approach:**

- Remove deprecated permission entries from CSV (e.g., `orchestrator.workflow.<workflowId>`)
- Remove deprecated permission with help of REST API in case if they was created in this way
- Create corresponding conditional policies with `IS_ALLOWED_WORKFLOW_ID` rule using at least one of these methods:
  - YAML file: `conditional-policies.yaml`
  - RBAC UI
  - REST API
- Configure the conditional policies file path in RBAC plugin configuration if using `conditional-policies.yaml`.

**IMPORTANT:** The CSV file contains ONLY basic permissions and RBAC role members definitions. Workflow-specific restrictions are defined separately in conditional policies (YAML file, RBAC UI, or REST API).

#### Example 1: Single workflow access with help of permissin file

**BEFORE (deprecated):**

```csv
# role members definition
g, group:default/my-ci-team, role:default/myflow-admin

# doesn't work any more
p, role:default/myflow-admin, orchestrator.workflow.myflow, read, allow
p, role:default/myflow-admin, orchestrator.workflow.use.myflow, update, allow
```

**AFTER (conditional permissions only):**

```csv
# role members definition. Still defined in the csv file.
g, group:default/my-ci-team, role:default/myflow-admin
```

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
roleEntityRef: 'role:default/myflow-admin'
permissionMapping:
  - read
  - update
```

#### Example 2: Multiple workflows

**BEFORE (deprecated):**

```csv
# role members definition
g, group:default/team-a, role:default/developer
g, group:default/team-b, role:default/developer

# doesn't work any more
p, role:default/developer, orchestrator.workflow.flow1, read, allow
p, role:default/developer, orchestrator.workflow.flow2, read, allow
p, role:default/developer, orchestrator.workflow.flow3, read, allow
p, role:default/developer, orchestrator.workflow.use.flow1, update, allow
p, role:default/developer, orchestrator.workflow.use.flow2, update, allow
```

**AFTER (basic permissions only):**

```csv
# role members definition
g, group:default/team-a, role:default/developer
g, group:default/team-b, role:default/developer
```

```yaml
result: CONDITIONAL
pluginId: orchestrator
resourceType: orchestrator-workflow
conditions:
  rule: IS_ALLOWED_WORKFLOW_ID
  resourceType: orchestrator-workflow
  params:
    workflowIds:
      - flow1
      - flow2
      - flow3
roleEntityRef: 'role:default/developer'
permissionMapping:
  - read
---
result: CONDITIONAL
pluginId: orchestrator
resourceType: orchestrator-workflow
conditions:
  rule: IS_ALLOWED_WORKFLOW_ID
  resourceType: orchestrator-workflow
  params:
    workflowIds:
      - flow1
      - flow2
roleEntityRef: 'role:default/developer'
permissionMapping:
  - update
```

#### Example 3: Full access (already using generic permissions)

**BEFORE:**

```csv
p, role:default/admin, orchestrator.workflow, read, allow
p, role:default/admin, orchestrator.workflow.use, update, allow
```

**AFTER (no change needed):**

```csv
p, role:default/admin, orchestrator.workflow, read, allow
p, role:default/admin, orchestrator.workflow.use, update, allow
```

### Step 3: Create Conditional Policies

For roles that need access to specific workflows only (not all workflows), create conditional policies using either a YAML configuration file or the RBAC REST API.

#### Option A: YAML Configuration File

Create a YAML file with conditional policies (recommended for static configuration).

**Configure the file path in `app-config.yaml`:**

```yaml
permission:
  rbac:
    policies-csv-file: path/to/rbac-policy.csv
    conditionalPoliciesFile: /path/to/conditional-policies.yaml
    policyFileReload: true # Optional: enable file watcher for permission files
    ...
```

**Create `conditional-policies.yaml` with migrated converted conditional policies**. See examples above.

#### Option B: RBAC UI (Dynamic Configuration)

Create conditional policies via RBAC UI:

1. Navigate to your RHDH RBAC Administration page
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

**Note:** Changes via RBAC UI are stored in the database and take effect immediately.

### Step 4: Remove Deprecated Policies

#### Remove from CSV file

Delete all lines from your CSV file containing deprecated permission patterns:

```bash
# Backup your file first
cp /path/to/rbac-policy.csv /path/to/rbac-policy.csv.backup

# Take a look, what will be removed

grep -E '^(##)?p, role:default/workflowUser, orchestrator\.workflow(\.use)?(\.[a-zA-Z0-9_-]+)?,' /path/to/rbac-policy.csv

# Take a look, what will remain

sed -E '/^(##)?p, role:default\/workflowUser, orchestrator\.workflow(\.use)?(\.[a-zA-Z0-9_-]+)?,/d' /path/to/rbac-policy.csv

# And if everything is ok, remove deprecated permissions
sed -i '' -E '/^(##)?p, role:default\/workflowUser, orchestrator\.workflow(\.use)?(\.[a-zA-Z0-9_-]+)?,/d' /path/to/rbac-policy.csv
```

Or manually edit the file and remove lines like:

```csv
p, role:default/user, orchestrator.workflow.yamlgreet, read, allow
p, role:default/user, orchestrator.workflow.use.checkout, update, allow
```

#### Remove policies via RBAC UI

RBAC UI doesn't allow users create or delete deprecated permissions.

#### Remove policies via REST API

If you created policies via REST API, then fetch the list of all policies to find the ones to delete

```bash
curl -X GET https://<your-rhdh-url>/api/permission/policies \
  -H "Authorization: Bearer $TOKEN"
```

Delete every specific deprecated permission policy

```bash
curl -X DELETE "https://<your-rhdh-url>/api/permission/policies/role/default/<your-role>" \
     -d '[
           {
             "permission": "orchestrator.workflow.myflow1",
             "policy": "read",
             "effect": "allow"
           },
           {
             "permission": "orchestrator.workflow.use.myflow1",
             "policy": "update",
             "effect": "allow"
           },
          {
             "permission": "orchestrator.workflow.myflow2",
             "policy": "read",
             "effect": "allow"
           },
           {
             "permission": "orchestrator.workflow.use.myflow2",
             "policy": "update",
             "effect": "allow"
           }
         ]' \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -v
```

### Step 5: Verify Migration

#### Test that new permissions work

1. **Verify conditional policies were created:**
   - **YAML file**: Check that your `conditional-policies.yaml` file contains the correct entries
   - **RBAC UI**: Navigate to RBAC Administration page and verify conditional policies are listed for the role

2. **Test user access:**
   - Log in as a user with the migrated role
   - Navigate to the Orchestrator workflows page
   - Verify you see ONLY workflows listed in the conditional policy `workflowIds`
   - Attempt to execute a workflow in the list (should succeed if user has "update" permission action)
   - Attempt to access a workflow NOT in the list (should get 403 Forbidden)

3. **Test full access (no conditional policy):**
   - Log in as a user with a role that has only basic permissions (no conditional policy)
   - Verify you see ALL workflows
   - Verify you can execute ALL workflows

4. **Test denied access:**
   - Log in as a user with no orchestrator permissions
   - Verify you see an empty workflow list
   - Verify you get 403 Forbidden when attempting to access any workflow

## Common Migration Scenarios

### Scenario 1: CSV-Only Users

You manage permissions only through `rbac-policy.csv` file.

**Migration steps:**

1. Update CSV to replace deprecated permissions with generic ones
2. Create `conditional-policies.yaml` file with workflow-specific access rules
3. Configure the conditional policies file path in RBAC plugin configuration
4. Remove deprecated permission entries from CSV
5. Reload or restart Backstage

### Scenario 2: REST API Users

You created roles and assigned permissions through the RBAC REST API.

**Migration steps:**

1. List existing policies via REST API to identify deprecated permissions
2. Create conditional policies via REST API or RBAC UI for workflow-specific access
3. Delete deprecated permission policies via REST API
4. Verify access via REST API or UI

**Note:** Conditional policies created via REST API or UI take effect immediately.

### Scenario 3: Mixed Configurations

You use a combination of CSV file and RBAC REST API. For this scenario keep in mind: RBAC plugin has deferentiation beetwen RBAC role source. If you created role with help of REST API , then you should migration this role with help of REST API. The same with permission policies files. You can not attach conditional policies from yaml file to the role created with help of REST API.

**Migration steps:**

1. Audit all sources (CSV file + REST API)
2. Update each source following the relevant scenario above.
3. Verify all users have correct access

## Complete Migration Examples

### Example 1: Read-only access to specific workflows

**Before:**

```csv
p, role:default/viewer, orchestrator.workflow.approval, read, allow
p, role:default/viewer, orchestrator.workflow.notification, read, allow
g, user:default/bob, role:default/viewer
```

**After:**

CSV file:

```csv
g, user:default/bob, role:default/viewer
```

Create conditional policies with help of YAML file (`conditional-policies.yaml`):

```yaml
conditionalPolicies:
  - permission: orchestrator.workflow
    resourceType: orchestrator-workflow
    result: CONDITIONAL
    roleEntityRef: role:default/viewer
    permissionMapping:
      - read
    conditions:
      rule: IS_ALLOWED_WORKFLOW_ID
      resourceType: orchestrator-workflow
      params:
        workflowIds:
          - approval
          - notification
```

### Example 2: Execute specific workflows only

**Before:**

```csv
p, role:default/operator, orchestrator.workflow.deploy, read, allow
p, role:default/operator, orchestrator.workflow.rollback, read, allow
p, role:default/operator, orchestrator.workflow.use.deploy, update, allow
p, role:default/operator, orchestrator.workflow.use.rollback, update, allow
g, user:default/charlie, role:default/operator
```

**After:**

CSV file:

```csv
g, user:default/charlie, role:default/operator
```

Conditional policies file (`conditional-policies.yaml`):

```yaml
conditionalPolicies:
  - permission: orchestrator.workflow
    resourceType: orchestrator-workflow
    result: CONDITIONAL
    roleEntityRef: role:default/operator
    permissionMapping:
      - read
    conditions:
      rule: IS_ALLOWED_WORKFLOW_ID
      resourceType: orchestrator-workflow
      params:
        workflowIds:
          - deploy
          - rollback
  - permission: orchestrator.workflow.use
    resourceType: orchestrator-workflow
    result: CONDITIONAL
    roleEntityRef: role:default/operator
    permissionMapping:
      - update
    conditions:
      rule: IS_ALLOWED_WORKFLOW_ID
      resourceType: orchestrator-workflow
      params:
        workflowIds:
          - deploy
          - rollback
```

### Example 3: Full access (no conditions needed)

**Before:**

```csv
p, role:default/admin, orchestrator.workflow, read, allow
p, role:default/admin, orchestrator.workflow.use, update, allow
p, role:default/admin, orchestrator.workflowAdminView, read, allow
g, user:default/eve, role:default/admin
```

**After (no change needed):**

```csv
p, role:default/admin, orchestrator.workflow, read, allow
p, role:default/admin, orchestrator.workflow.use, update, allow
p, role:default/admin, orchestrator.workflowAdminView, read, allow
g, user:default/eve, role:default/admin
```

**No conditional policy needed** - user has access to ALL workflows.

## Troubleshooting

### User lost access after upgrade

**Problem:** User had `orchestrator.workflow.myflow` permission but now sees empty workflow list.

**Root cause:** Deprecated specific permission was removed, but no conditional policy was created.

**Solution:**

Create conditional policy (see Step 3 above).

### Cannot create conditional policy via RBAC UI

**Problem:** 403 Forbidden when trying to create conditional policy via RBAC UI.

**Root cause:** User doesn't have admin access to RBAC.

**Solution:** Configure RBAC admins in `app-config.yaml`:

```yaml
permission:
  enabled: true
  rbac:
    admin:
      users:
        - name: user:default/YOUR_USERNAME
```

Restart Backstage after making this change.

### Conditional policy not working

**Problem:** Created conditional policy, but user still can't access workflows.

**Potential causes:**

- defined wrong workflow id or action("update" instead of "read" and so on)
- user is not member of the RBAC role which has assinged corresponding permissions

**Solution:** Double check conditional policies. Make sure that user is member of the RBAC role.

### Can see workflow but cannot execute

**Problem:** Workflow appears in list but execute button fails with 403.

**Root cause:** User has read conditional policy but no execute conditional policy.

**Solution:** Add "update" action to the `permissionMapping` section in the created conditional policy. Or create separated conditional policy with "update" action to allow execute workflow.

### Changes not taking effect

**Problem:** Updated CSV file but changes aren't reflected.

**Solution:**

1. Check if `policyFileReload: true` is enabled in `app-config.yaml`:

   ```yaml
   permission:
     rbac:
       policyFileReload: true
   ```

2. If not enabled, restart Backstage:

   ```bash
   # Stop and restart your Backstage instance
   ```

3. Verify permission files path are correct in config:

   ```yaml
   permission:
     rbac:
       policies-csv-file: /absolute/path/to/rbac-policy.csv
       conditionalPoliciesFile: /path/to/conditional-policies.yaml
   ```

4. Check RHDH logs for CSV parsing errors/warnings. RBAC plugin skips permissions with invalid format, but log warnings.

## Reference

### Permission Names

| Permission Name                  | Resource Type           | Description                                       |
| -------------------------------- | ----------------------- | ------------------------------------------------- |
| `orchestrator.workflow`          | `orchestrator-workflow` | Read access to workflow definitions and instances |
| `orchestrator.workflow.use`      | `orchestrator-workflow` | Execute and abort workflows                       |
| `orchestrator.workflowAdminView` | basic                   | View workflow definition editor                   |
| `orchestrator.instanceAdminView` | basic                   | View all workflow instances                       |

### Resource Type

- **Resource type:** `orchestrator-workflow`
- Used in both permission definitions and conditional policies

### Rule Name

- **Rule name:** `IS_ALLOWED_WORKFLOW_ID`
- Used in conditional policies to specify allowed workflow IDs

### REST API Endpoints (for viewing existing policies)

Use these endpoints to audit existing permissions and find roles with deprecated permissions:

| Method | Endpoint                            | Description                               |
| ------ | ----------------------------------- | ----------------------------------------- |
| GET    | `/api/permission/policies`          | List all policies to find deprecated ones |
| GET    | `/api/permission/policies/:roleRef` | List policies for a role                  |
| GET    | `/api/permission/roles/conditions`  | List all conditional policies             |

### Related Documentation

- [Orchestrator Permissions Documentation](./Permissions.md)
- [RBAC Conditional Policies Documentation](https://github.com/backstage/community-plugins/tree/main/workspaces/rbac/plugins/rbac-backend/docs/conditions.md)
- [Red Hat Developer Hub Authorization Documentation](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.2/html/authorization/index)

### Configuration Reference

**app-config.yaml:**

```yaml
permission:
  enabled: true
  rbac:
    policies-csv-file: /path/to/rbac-policy.csv
    conditionalPoliciesFile: /path/to/conditional-policies.yaml # Optional: for YAML-based conditional policies
    pluginsWithPermission:
      - orchestrator
      # ... more plugin ids
    policyFileReload: true
    admin:
      users:
        - name: user:default/YOUR_USERNAME
```

## Support

For questions or issues with migration:

- Review the [Permissions.md](./Permissions.md) documentation
- Check RBAC plugin conditional policies documentation
- Test in non-production environment first
- Consult Red Hat Developer Hub authorization documentation

**Before upgrading to the new plugin version:**

1. Audit your current permissions (Step 1)
2. Test the migration in a non-production environment
3. Document your current configuration for rollback if needed
4. Schedule a maintenance window for the upgrade

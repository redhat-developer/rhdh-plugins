# Migration Guide: Dynamic Workflow Permissions to Conditional Policies

This guide walks you through migrating from deprecated per-workflow dynamic permissions to conditional policies.

For permission definitions, configuration, and API reference, see [Permissions.md](./Permissions.md).

## Deprecation Notice

**As of orchestrator plugin version 2.1.0**, dynamic permissions (`orchestrator.workflow.<workflowId>` and `orchestrator.workflow.use.<workflowId>`) are **deprecated** and will be removed in the next release.

They still work in this release alongside conditional policies. In the **next release**, users with only dynamic permissions will see an empty workflow list and get 403 errors.

See [Important notes about dynamic permissions](./Permissions.md#important-notes-about-dynamic-permissions) in Permissions.md for how both systems interact during the transition.

## Overview

### What Changed and Why

**Before:** Per-workflow dynamic permissions (`orchestrator.workflow.<workflowId>`, `orchestrator.workflow.use.<workflowId>`) — creatable only via CSV or REST API, not visible in RBAC UI.

**Now (recommended):** Generic permissions (`orchestrator.workflow`, `orchestrator.workflow.use`) combined with conditional policies using `IS_ALLOWED_WORKFLOW_ID`. See [Orchestrator Permissions](./Permissions.md#orchestrator-permissions) and [Using Conditional Policies](./Permissions.md#using-conditional-policies).

**Why this change:**

- Improved performance — conditional policies are evaluated once per request
- Better alignment with Backstage RBAC architecture
- Full RBAC UI compatibility
- Cleaner authorization code

### Who Needs to Migrate

You should migrate if:

- Your `rbac-policy.csv` contains `orchestrator.workflow.<workflowId>` or `orchestrator.workflow.use.<workflowId>`
- You created dynamic permissions via REST API
- Your users have per-workflow access (not full access to all workflows)

You do NOT need to migrate if:

- You only use generic permissions with no workflow-specific restrictions
- All users have full access to all workflows

## What Is Deprecated

Deprecated permission patterns still work in this release:

```csv
# DEPRECATED - still works but will be removed in the next release
p, role:default/user, orchestrator.workflow.yamlgreet, read, allow
p, role:default/user, orchestrator.workflow.use.checkout, update, allow
```

If you created dynamic permissions via REST API, delete them via REST API and replace with conditional policies. The RBAC UI cannot display or manage them — see [RBAC UI Compatibility](./Permissions.md#rbac-ui-compatibility).

There is **no automatic migration**. You must manually create the new configuration.

## New Authorization Model

Conditional policies restrict access to specific workflows using the `IS_ALLOWED_WORKFLOW_ID` rule.

- **Rule parameters:** see [Rule Parameters](./Permissions.md#rule-parameters)
- **YAML / RBAC UI / REST API options:** see [Using Conditional Policies](./Permissions.md#using-conditional-policies)
- **Workflow ID format:** see [Workflow Identifier](./Permissions.md#workflow-identifier)

**Minimal YAML example** (read + execute for one workflow):

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

```bash
grep "orchestrator.workflow\." /path/to/rbac-policy.csv \
  | grep -vE ', orchestrator\.workflow\.use,|, orchestrator\.workflow,'
```

The first `grep` finds lines with a workflow-specific permission segment. The second excludes known **generic** permission names that must be kept:

- `orchestrator.workflow` (read access to all workflows)
- `orchestrator.workflow.use` (execute access to all workflows)

Deprecated entries look like `orchestrator.workflow.yamlgreet` or `orchestrator.workflow.use.checkout` — they contain an extra workflow ID segment after the dot.

**Example deprecated entries:**

```csv
p, role:default/developer, orchestrator.workflow.yamlgreet, read, allow
p, role:default/developer, orchestrator.workflow.checkout, read, allow
p, role:default/developer, orchestrator.workflow.use.yamlgreet, update, allow
```

Extract: role name, workflow IDs, and permission action (read or execute).

#### Check policies created via REST API

```bash
curl -X GET "https://your-backstage-url/api/permission/policies/role:default/developer" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### List existing conditional policies

See [Viewing Conditional Policies](./Permissions.md#viewing-conditional-policies).

### Step 2: Migrate to Conditional Policies

Replace deprecated per-workflow permissions with conditional policies.

**Migration approach:**

- Remove deprecated entries from CSV (e.g., `orchestrator.workflow.<workflowId>`)
- Remove deprecated permissions via REST API if created that way
- Create conditional policies with `IS_ALLOWED_WORKFLOW_ID` via YAML file, RBAC UI, or REST API
- Configure `conditionalPoliciesFile` in app-config if using a YAML file — see [Enable permissions](./Permissions.md#enable-permissions)

**IMPORTANT:** CSV contains only basic permissions and role members. Workflow-specific restrictions go in conditional policies.

#### Example 1: Single workflow access

**BEFORE (deprecated):**

```csv
g, group:default/my-ci-team, role:default/myflow-admin
p, role:default/myflow-admin, orchestrator.workflow.myflow, read, allow
p, role:default/myflow-admin, orchestrator.workflow.use.myflow, update, allow
```

**AFTER:**

```csv
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
      - myflow
roleEntityRef: 'role:default/myflow-admin'
permissionMapping:
  - read
  - update
```

#### Example 2: Multiple workflows

**BEFORE (deprecated):**

```csv
g, group:default/team-a, role:default/developer
p, role:default/developer, orchestrator.workflow.flow1, read, allow
p, role:default/developer, orchestrator.workflow.flow2, read, allow
p, role:default/developer, orchestrator.workflow.flow3, read, allow
p, role:default/developer, orchestrator.workflow.use.flow1, update, allow
p, role:default/developer, orchestrator.workflow.use.flow2, update, allow
```

**AFTER:**

```csv
g, group:default/team-a, role:default/developer
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

#### Example 3: Full access (no change needed)

```csv
p, role:default/admin, orchestrator.workflow, read, allow
p, role:default/admin, orchestrator.workflow.use, update, allow
```

See also [Full Access (No Conditional Policy Needed)](./Permissions.md#full-access-no-conditional-policy-needed).

### Step 3: Create Conditional Policies

Choose one approach — full instructions in Permissions.md:

- **YAML file:** [Option 1](./Permissions.md#option-1-add-permission-policies-files-to-define-rbac-role-and-conditional-policies)
- **RBAC UI:** [Option 2](./Permissions.md#option-2-create-conditional-policy-with-help-of-rbac-ui)
- **REST API:** [Option 3](./Permissions.md#option-3-create-conditional-policy-via-rest-api)

### Step 4: Remove Deprecated Policies

#### Remove from CSV file

```bash
cp /path/to/rbac-policy.csv /path/to/rbac-policy.csv.backup

# Preview lines to remove (grep from [Step 1](#find-deprecated-permissions-in-csv-file);
# excludes generic orchestrator.workflow and orchestrator.workflow.use)
grep "orchestrator.workflow\." /path/to/rbac-policy.csv \
  | grep -vE ', orchestrator\.workflow\.use,|, orchestrator\.workflow,'

# Remove the lines shown by the preview grep (recommended — works in any editor)
```

Or manually remove lines like:

```csv
p, role:default/user, orchestrator.workflow.yamlgreet, read, allow
p, role:default/user, orchestrator.workflow.use.checkout, update, allow
```

Optional automation with `sed` (macOS / Linux — `perl` not required).
Workflow IDs have no fixed character set in the orchestrator plugin; these patterns match the permission segment in CSV up to the next comma:

```bash
# macOS
sed -i '' -E '/, orchestrator\.workflow\.use\.[^,]+,/d' /path/to/rbac-policy.csv
sed -i '' -E '/, orchestrator\.workflow\.[^,]+, read,/d' /path/to/rbac-policy.csv

# Linux (GNU sed)
sed -i -E '/, orchestrator\.workflow\.use\.[^,]+,/d' /path/to/rbac-policy.csv
sed -i -E '/, orchestrator\.workflow\.[^,]+, read,/d' /path/to/rbac-policy.csv
```

#### Remove policies via RBAC UI

RBAC UI doesn't allow users to create or delete deprecated permissions.

#### Remove policies via REST API

If you created policies via REST API, fetch the list of all policies to find the ones to delete:

```bash
curl -X GET https://<your-rhdh-url>/api/permission/policies \
  -H "Authorization: Bearer $TOKEN"
```

Delete every specific deprecated permission policy:

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
           }
         ]' \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -v
```

### Step 5: Verify Migration

1. **Verify conditional policies were created** — check your YAML file or RBAC UI
2. **Test user access** — user should see only workflows in `workflowIds`, execute only with `update` mapping
3. **Test full access** — role with basic permissions and no conditional policy sees all workflows
4. **Test denied access** — user with no orchestrator permissions sees empty list and gets 403

## Common Migration Scenarios

### Scenario 1: CSV-Only Users

1. Create `conditional-policies.yaml` with workflow-specific rules
2. Configure file paths — [Enable permissions](./Permissions.md#enable-permissions)
3. Remove deprecated CSV entries
4. Reload or restart Backstage

### Scenario 2: REST API Users

1. List existing policies to identify deprecated permissions
2. Create conditional policies via REST API or RBAC UI — [Managing Conditional Policies via REST API](./Permissions.md#managing-conditional-policies-via-rest-api)
3. Delete deprecated policies via REST API
4. Verify access

### Scenario 3: Mixed Configurations

RBAC roles created via REST API must be migrated via REST API; roles from CSV files via CSV/YAML. You cannot attach YAML conditional policies to REST API-created roles.

1. Audit all sources (CSV + REST API)
2. Migrate each source using the relevant scenario above
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

```csv
g, user:default/bob, role:default/viewer
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
      - approval
      - notification
roleEntityRef: 'role:default/viewer'
permissionMapping:
  - read
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

```csv
g, user:default/charlie, role:default/operator
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
      - deploy
      - rollback
roleEntityRef: 'role:default/operator'
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
      - deploy
      - rollback
roleEntityRef: 'role:default/operator'
permissionMapping:
  - update
```

### Example 3: Full access (no conditions needed)

No conditional policy needed — see [Example 3 in Step 2](#example-3-full-access-no-change-needed).

## Troubleshooting

### User lost access after upgrade

**Problem:** User had `orchestrator.workflow.myflow` but now sees empty workflow list.

**Solution:** Create a conditional policy — [Step 3](#step-3-create-conditional-policies).

### Cannot create conditional policy via RBAC UI

**Problem:** 403 Forbidden when creating conditional policy.

**Solution:** Configure RBAC admins — see [Enable permissions](./Permissions.md#enable-permissions).

### Conditional policy not working

**Potential causes:** wrong workflow ID, wrong action (`read` vs `update`), user not a member of the RBAC role.

**Solution:** Double-check conditional policies and role membership.

### Can see workflow but cannot execute

**Root cause:** Read conditional policy exists but no execute (`update`) policy.

**Solution:** Add `update` to `permissionMapping` or create a separate conditional policy for execute access.

### Changes not taking effect

1. Enable `policyFileReload: true` or restart Backstage — [Enable permissions](./Permissions.md#enable-permissions)
2. Verify `policies-csv-file` and `conditionalPoliciesFile` paths are correct
3. Check RHDH logs for CSV parsing warnings

## Reference

| Topic                             | See                                                                                                                                           |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Permission names and descriptions | [Orchestrator Permissions](./Permissions.md#orchestrator-permissions)                                                                         |
| Rule parameters                   | [Rule Parameters](./Permissions.md#rule-parameters)                                                                                           |
| app-config setup                  | [Enable permissions](./Permissions.md#enable-permissions)                                                                                     |
| REST API (create/update/delete)   | [Managing Conditional Policies via REST API](./Permissions.md#managing-conditional-policies-via-rest-api)                                     |
| RBAC UI limitations               | [RBAC UI Compatibility](./Permissions.md#rbac-ui-compatibility)                                                                               |
| External RBAC docs                | [RBAC Conditional Policies](https://github.com/backstage/community-plugins/tree/main/workspaces/rbac/plugins/rbac-backend/docs/conditions.md) |

## Support

- [Permissions.md](./Permissions.md) — full reference documentation
- Test migration in a non-production environment first
- Before upgrading: audit permissions (Step 1), test migration, document current config for rollback

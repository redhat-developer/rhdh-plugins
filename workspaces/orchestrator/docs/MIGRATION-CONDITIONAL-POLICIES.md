# Migration Guide: Deprecated Workflow Permissions to Conditional Policies

## Breaking Change Notice

**This is a breaking change.** As of orchestrator plugin version 2.1.0, the following permissions are **NO LONGER SUPPORTED**:

- `orchestrator.workflow.<workflowId>` (e.g., `orchestrator.workflow.yamlgreet`)
- `orchestrator.workflow.use.<workflowId>` (e.g., `orchestrator.workflow.use.checkout`)

These deprecated per-workflow permissions have been removed from the codebase. You **MUST** migrate to conditional policies using the `IS_ALLOWED_WORKFLOW_ID` rule.

**Impact:** Users granted access only via deprecated permissions will lose access immediately after upgrade until you complete the migration.

## Overview

### What Changed and Why

**Before:** The orchestrator plugin used specific permissions created per workflow:

- `orchestrator.workflow.<workflowId>` for read access
- `orchestrator.workflow.use.<workflowId>` for execute access

**Now:** Only generic resource permissions are supported:

- `orchestrator.workflow` for read access (all workflows or restricted via conditional policies)
- `orchestrator.workflow.use` for execute access (all workflows or restricted via conditional policies)

**Why this change:**

- Improved performance - conditional policies are evaluated once per request instead of checking permissions for each workflow individually
- Better alignment with Backstage RBAC architecture
- Full compatibility with RBAC UI (which only supports static permissions)
- Cleaner, more maintainable authorization code
- Deprecated permissions are not visible in the RBAC UI

### Who Needs to Migrate

You need to migrate if:

- Your `rbac-policy.csv` file contains permissions like `orchestrator.workflow.<workflowId>` or `orchestrator.workflow.use.<workflowId>`
- You created RBAC roles with not supported any more permissions via RBAC UI or REST API using deprecated permission names
- Your users currently have per-workflow access (not full access to all workflows)

You do NOT need to migrate if:

- You only use generic permissions (`orchestrator.workflow`, `orchestrator.workflow.use`) with no workflow-specific restrictions
- All your users have full access to all workflows

## What Was Removed

### Deprecated Permissions No Longer Work

These permission patterns(`p, role:default/<any-your-custom-role>, orchestrator.workflow.<workflowId>, read, allow`) are completely removed and will have **no effect** after upgrade:

```csv
# THESE NO LONGER WORK - DO NOT USE
p, role:default/user, orchestrator.workflow.yamlgreet, read, allow
p, role:default/user, orchestrator.workflow.use.checkout, update, allow
p, role:default/developer, orchestrator.workflow.approval, read, allow
```

**After upgrade:** Users with only these permissions will see an empty workflow list and get "403 Forbidden" errors when attempting to access workflows.

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

- **YAML file**: Static configuration committed to source control
- **RBAC plugin UI**: Dynamic configuration stored in database
- **REST API**: Dynamic configuration stored in database

### The IS_ALLOWED_WORKFLOW_ID Rule

**Rule parameters:**

- **Rule name:** `IS_ALLOWED_WORKFLOW_ID`
- **Resource type:** `orchestrator-workflow`
- **Plugin ID:** `orchestrator`
- **Parameter:** `workflowIds` - array of workflow IDs to grant access to

**Example conditional policy in yaml format:**

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
- Remove deprecated permission entries from RBAC UI
- Create corresponding conditional policies with `IS_ALLOWED_WORKFLOW_ID` rule using at least one of these methods:
  - YAML file: `conditional-policies.yaml`
  - RBAC UI
  - REST API
- Configure the conditional policies file path in RBAC plugin configuration if using `conditional-policies.yaml`.

**IMPORTANT:** The CSV file contains ONLY basic permissions. Workflow-specific restrictions are defined separately in conditional policies (YAML file, RBAC UI, or REST API).

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

Create a YAML file with conditional policies (recommended for static configuration):

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

Todo UI migration guide

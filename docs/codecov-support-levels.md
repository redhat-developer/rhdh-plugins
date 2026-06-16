# Codecov Coverage by Support Level

**Epic**: RHIDP-13497 — Plugin Testing by Support Level  
**Task**: RHIDP-13511  
**Feature umbrella**: RHDHPLAN-851

## Overview

Codecov dashboard for [redhat-developer/rhdh-plugins](https://app.codecov.io/gh/redhat-developer/rhdh-plugins) shows coverage **grouped by support level** (GA, Tech-Preview, Community, Dev-Preview) using Codecov's **Components** feature.

This allows the team to:

- Track coverage metrics per support level
- Identify which support tiers need more test coverage
- Set different coverage targets for different support levels (future)
- Visualize coverage trends by plugin maturity

## Architecture

### Component Definitions

Coverage grouping is configured in [`codecov.yml`](../codecov.yml) under `component_management`:

```yaml
component_management:
  individual_components:
    - component_id: ga-plugins
      name: 'GA Plugins'
      paths:
        - workspaces/lightspeed/
        - workspaces/orchestrator/
        # ... (17 GA workspaces)

    - component_id: tech-preview-plugins
      name: 'Tech-Preview Plugins'
      paths:
        - workspaces/bulk-import/
        # ... (8 TP workspaces)

    - component_id: community-plugins
      name: 'Community Plugins'
      paths:
        - workspaces/3scale/
        # ... (39 Community workspaces)

    - component_id: dev-preview-plugins
      name: 'Dev-Preview Plugins'
      paths:
        - workspaces/konflux/
        # ... (6 Dev-Preview workspaces)
```

### Workspace-to-Support-Level Mapping

Support level metadata is defined in **[rhdh-plugin-export-overlays](https://github.com/redhat-developer/rhdh-plugin-export-overlays)** repository:

```yaml
# workspaces/lightspeed/metadata/rhdh-bsp-lightspeed.yaml
spec:
  packageName: '@red-hat-developer-hub/backstage-plugin-lightspeed'
  support: generally-available # ← Support level metadata
  lifecycle: active
```

**Mapping script**: [`scripts/generate-codecov-components.sh`](../scripts/generate-codecov-components.sh) extracts workspace-to-support-level mappings from overlay metadata and generates YAML for `codecov.yml`.

### Multi-Level Workspaces

Some workspaces (e.g., `backstage`, `homepage`, `analytics`) appear in **multiple components** because they contain packages with different support levels.

**Example**: `workspaces/backstage/` contains:

- **GA packages**: `backstage-plugin-catalog-backend-module-github`, `backstage-plugin-techdocs`
- **Tech-Preview packages**: `backstage-plugin-notifications-backend`, `backstage-plugin-kubernetes`
- **Community packages**: `backstage-plugin-auth`, `backstage-plugin-scaffolder-backend-module-bitbucket`
- **Dev-Preview packages**: `backstage-plugin-mcp-actions-backend`

**Behavior**: Coverage from `workspaces/backstage/` is included in **all 4 components** (GA, TP, Community, Dev-Preview). This is correct — the component represents **packages** at that support level, not exclusive workspace ownership.

## Dashboard Usage

### Viewing Coverage by Support Level

1. Navigate to [rhdh-plugins Codecov dashboard](https://app.codecov.io/gh/redhat-developer/rhdh-plugins)
2. Click **"Components"** tab
3. See coverage % for each component:
   - **GA Plugins** (17 workspaces)
   - **Tech-Preview Plugins** (8 workspaces)
   - **Community Plugins** (39 workspaces)
   - **Dev-Preview Plugins** (6 workspaces)

### Interpreting Results

**Component coverage** shows aggregate coverage across all files in matching workspaces. If a workspace appears in multiple components (e.g., `backstage`), its coverage contributes to all relevant components.

**Workspace-level detail**: Use the **"Flags"** tab to see per-workspace coverage (e.g., `lightspeed`, `orchestrator`). This granularity is unchanged — components provide a higher-level grouping view.

## Maintenance

### When to Update Component Lists

Update `codecov.yml` component definitions when:

1. **Support level changes** — A package moves from Tech-Preview → GA or Community → GA
2. **New workspaces added** — A new plugin workspace is created in `rhdh-plugin-export-overlays`
3. **Workspace removed** — A plugin workspace is deprecated or deleted

### How to Update

#### Automated (Recommended)

Run the generation script to sync from overlay metadata:

```bash
cd rhdh-plugins

# Generate updated component definitions
./scripts/generate-codecov-components.sh \
  ~/path/to/rhdh-plugin-export-overlays > /tmp/codecov-components.yaml

# Review differences
diff -u codecov.yml /tmp/codecov-components.yaml

# Manually merge the component_management block into codecov.yml
```

**Why manual merge?** The script outputs only the `component_management` block. You must preserve the rest of `codecov.yml` (flags, coverage settings, ignore patterns).

#### Manual Update

1. Check support level in overlay metadata:

   ```bash
   cd rhdh-plugin-export-overlays
   grep -r "support:" workspaces/your-workspace/metadata/
   ```

2. Add workspace to appropriate component in `codecov.yml`:

   ```yaml
   - component_id: ga-plugins
     name: 'GA Plugins'
     paths:
       - workspaces/your-new-workspace/ # ← Add here
   ```

3. Validate YAML syntax:
   ```bash
   python3 -c "import yaml; yaml.safe_load(open('codecov.yml'))"
   ```

### CI Validation (Future)

**Planned**: Add CI job to detect drift between overlay metadata and `codecov.yml` components:

```bash
# Pseudocode for future CI check
scripts/generate-codecov-components.sh ../rhdh-plugin-export-overlays > /tmp/generated.yaml
diff -u <(yq '.component_management' codecov.yml) /tmp/generated.yaml
if [ $? -ne 0 ]; then
  echo "ERROR: codecov.yml components are out of sync with overlay metadata"
  exit 1
fi
```

This ensures components stay in sync with metadata changes without manual updates.

## Frequently Asked Questions

### Why don't we use flag names like `ga-lightspeed` instead of components?

**Reason**: Historical data preservation. Renaming flags breaks Codecov trends. Components provide support-level grouping **without changing existing flags**, preserving historical coverage data.

### Can I filter coverage by support level in PRs?

**Not directly**. PR comments show per-flag coverage (e.g., `lightspeed`, `orchestrator`). To see support-level coverage, check the **main/release branch dashboard** after merge.

**Future enhancement**: Configure Codecov to post component-level coverage deltas in PR comments.

### Why does `workspaces/backstage/` appear in all 4 components?

Because `backstage` workspace contains **packages with different support levels**. Each package's support level is defined in overlay metadata. A workspace with mixed support levels contributes to multiple components.

This is **correct behavior** — components group by **package support level**, not workspace exclusivity.

### How do I set different coverage targets for GA vs Community?

**Not currently configured**. All components inherit `target: auto` from `coverage.status.project.default`.

**Future enhancement** (requires Codecov Pro features):

```yaml
component_management:
  individual_components:
    - component_id: ga-plugins
      name: 'GA Plugins'
      statuses:
        - type: project
          target: 80% # Require 80% for GA
    - component_id: community-plugins
      name: 'Community Plugins'
      statuses:
        - type: project
          target: 50% # Lower bar for Community
```

This is **not implemented yet** — all components currently use the same target (auto).

## Related Documentation

- [Codecov YAML Reference](https://docs.codecov.com/docs/codecov-yaml)
- [Codecov Components Guide](https://docs.codecov.com/docs/components)
- [RHDH Plugin Export Overlays](https://github.com/redhat-developer/rhdh-plugin-export-overlays)
- [Support Level Metadata Spec](https://github.com/redhat-developer/rhdh-plugin-export-overlays/blob/main/docs/metadata-spec.md)

## Changelog

- **2026-06-16**: Initial implementation (RHIDP-13511)
  - Added component definitions for GA/TP/Community/Dev-Preview
  - Created `scripts/generate-codecov-components.sh` automation
  - 70 workspaces mapped across 4 support levels

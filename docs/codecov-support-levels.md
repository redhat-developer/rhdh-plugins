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
        # ... (GA workspaces present in this repo)

    - component_id: tech-preview-plugins
      name: 'Tech-Preview Plugins'
      paths:
        - workspaces/bulk-import/
        # ... (Tech-Preview workspaces present in this repo)

    - component_id: community-plugins
      name: 'Community Plugins'
      paths:
        - workspaces/theme/
        # ... (Community workspaces present in this repo)

    - component_id: dev-preview-plugins
      name: 'Dev-Preview Plugins'
      paths:
        - workspaces/konflux/
        # ... (Dev-Preview workspaces present in this repo)
```

> This block is **generated** from overlay metadata and should not be edited by
> hand — see [Maintenance](#maintenance). Only workspaces that actually exist in
> this repository are included; overlay workspaces sourced from other upstreams
> (e.g. `backstage/community-plugins`) are skipped because there is no coverage
> for them here.

### Workspace-to-Support-Level Mapping

Support level metadata is defined in **[rhdh-plugin-export-overlays](https://github.com/redhat-developer/rhdh-plugin-export-overlays)** repository:

```yaml
# workspaces/lightspeed/metadata/rhdh-bsp-lightspeed.yaml
spec:
  packageName: '@red-hat-developer-hub/backstage-plugin-lightspeed'
  support: generally-available # ← Support level metadata
  lifecycle: active
```

**Mapping script**: [`scripts/generate-codecov-components.sh`](../scripts/generate-codecov-components.sh) reads the `spec.support` field from each overlay metadata file, groups workspaces by support level, keeps only the workspaces that exist in this repository, and rewrites the `component_management` block of `codecov.yml`. It runs in three modes — print, `--write`, and `--check` (see [Maintenance](#maintenance)).

### Multi-Level Workspaces

A workspace appears in **multiple components** when it contains packages with different support levels. Among the workspaces present in this repository, `homepage` is the current example: it has GA packages and Tech-Preview packages, so `workspaces/homepage/` is listed under both the `ga-plugins` and `tech-preview-plugins` components.

**Behavior**: Coverage from a multi-level workspace is included in **every** component that matches one of its packages' support levels. This is intentional — a component represents **packages** at that support level, not exclusive workspace ownership.

## Dashboard Usage

### Viewing Coverage by Support Level

1. Navigate to [rhdh-plugins Codecov dashboard](https://app.codecov.io/gh/redhat-developer/rhdh-plugins)
2. Click **"Components"** tab
3. See coverage % for each component (counts reflect workspaces present in this
   repository and update automatically as support levels change in the overlay):
   - **GA Plugins**
   - **Tech-Preview Plugins**
   - **Community Plugins**
   - **Dev-Preview Plugins**

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

**You normally don't.** The `component_management` block is kept in sync
automatically by the [`Sync Codecov components by support level`](../.github/workflows/sync-codecov-components.yml)
workflow:

- **Weekly + on demand** (`schedule` / `workflow_dispatch`): the workflow checks
  out the overlay repo, runs the script in `--write` mode, and opens a PR titled
  _"chore: sync codecov components with overlay support levels"_ whenever a
  plugin's support level changed. Review and merge that PR.
- **On every pull request** that touches `codecov.yml`, the script, or the
  workflow: a `--check` job fails if `codecov.yml` has drifted from the overlay
  metadata, so the block can't be hand-edited out of sync.

#### Regenerating locally

If you want to produce or preview the change yourself (e.g. to merge the sync PR
faster, or to debug the workflow):

```bash
cd rhdh-plugins

# Clone the overlay repo somewhere (sibling dir by default)
git clone --depth 1 https://github.com/redhat-developer/rhdh-plugin-export-overlays.git ../rhdh-plugin-export-overlays

# Preview the generated block
./scripts/generate-codecov-components.sh --overlay ../rhdh-plugin-export-overlays

# Rewrite the component_management block in codecov.yml in place
./scripts/generate-codecov-components.sh --write --overlay ../rhdh-plugin-export-overlays

# Or just verify there is no drift (exit 1 + diff if out of sync) — this is what CI runs
./scripts/generate-codecov-components.sh --check --overlay ../rhdh-plugin-export-overlays
```

`--write` only replaces the `component_management` block; the rest of
`codecov.yml` (flags, coverage settings, ignore patterns) is preserved. The
output is deterministic (no timestamps), so re-running it is a no-op when already
in sync.

## Frequently Asked Questions

### Why don't we use flag names like `ga-lightspeed` instead of components?

**Reason**: Historical data preservation. Renaming flags breaks Codecov trends. Components provide support-level grouping **without changing existing flags**, preserving historical coverage data.

### Can I filter coverage by support level in PRs?

**Not directly**. PR comments show per-flag coverage (e.g., `lightspeed`, `orchestrator`). To see support-level coverage, check the **main/release branch dashboard** after merge.

**Future enhancement**: Configure Codecov to post component-level coverage deltas in PR comments.

### Why does a workspace (e.g. `workspaces/homepage/`) appear in more than one component?

Because that workspace contains **packages with different support levels**. Each package's support level is defined in overlay metadata. A workspace with mixed support levels contributes to every matching component.

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

## Known Limitations

### Multi-Level Workspace Coverage Skew

A workspace that contains packages at different support levels causes **coverage skew** in component metrics. Among the workspaces present in this repository, `homepage` is currently the only such case (GA + Tech-Preview packages); the script reports the exact set on every run.

**How skew happens:**

Codecov components aggregate coverage by **path**, not by individual package. When `workspaces/homepage/` is included in the `ga-plugins` component, coverage from **all** of its packages (both GA and Tech-Preview) contributes to the GA component metric.

**Example scenario:**

```
Actual coverage:
- homepage GA packages:  85% coverage
- homepage TP packages:  60% coverage

Component shows:
- ga-plugins component: weighted average of both, not pure GA coverage
```

**Impact:**

- ✅ **For visibility and trends**: Components still provide useful information about relative coverage across support levels
- ✅ **For baseline tracking**: Component trends over time remain valid (skew is consistent)
- ⚠️ **For enforcement**: Component coverage does **not** represent precise coverage of only GA packages

**When this matters:**

If you need **precise GA coverage metrics** for enforcement (e.g., "GA plugins must have 80% coverage"), use individual **workspace flags** instead of components:

- Use flag `lightspeed` (100% GA) for accurate GA coverage
- Avoid relying on `ga-plugins` component for workspaces with mixed support levels

**Workaround:**

When checking GA coverage on the dashboard, mentally exclude the multi-level workspaces (currently just `homepage`) and focus on the single-level GA workspaces for accurate metrics.

**Future solution:**

If precise enforcement becomes necessary, we can:

1. Switch to per-package paths for multi-level workspaces
2. Use Codecov's dashboard filtering features (if available)
3. Split multi-level workspaces by support level (major refactor, not recommended)

This limitation is **accepted** for now as the benefits (visibility, trends, baseline) outweigh the drawbacks. We can revisit if enforcement requirements change.

## Related Documentation

- [Codecov YAML Reference](https://docs.codecov.com/docs/codecov-yaml)
- [Codecov Components Guide](https://docs.codecov.com/docs/components)
- [RHDH Plugin Export Overlays](https://github.com/redhat-developer/rhdh-plugin-export-overlays)

## Changelog

- **2026-06-18**: Dynamic sync from overlay metadata
  - `scripts/generate-codecov-components.sh` now supports `--write` (rewrite the
    block in place) and `--check` (fail on drift) and includes only workspaces
    present in this repository
  - Added `.github/workflows/sync-codecov-components.yml` — weekly/on-demand auto
    PR on support-level changes, plus a pull-request drift check
  - Regenerated `codecov.yml` to the filtered set, removing component paths for
    overlay workspaces that don't exist in this repo
- **2026-06-16**: Initial implementation (RHIDP-13511)
  - Added component definitions for GA/TP/Community/Dev-Preview
  - Created `scripts/generate-codecov-components.sh` automation
  - 70 workspaces mapped across 4 support levels

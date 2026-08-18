# Scorecard Backend Module for Catalog

This is an extension module to the `backstage-plugin-scorecard-backend` plugin. It provides configurable catalog entity metrics, evaluating entity fields (e.g., `metadata.title`, `spec.lifecycle`) against configurable rules and mapping field states to status strings via a three-tier status mapping merge (metric-level > options-level > hardcoded defaults).

The module supports:

- **Required attribute metrics** — verify that a field exists and is non-empty
- **Value whitelist metrics** — verify that a field contains one of a set of accepted values
- **Per-metric entity filters** — scope each metric to specific entity kinds or types
- **Configurable status mapping** — control what status is reported for each field state (`exists`, `empty`, `emptyString`, `emptyArray`, `missed`) and for specific field values
- **Automatic threshold rule generation** — threshold rules are derived from the status mappings, so you don't need to define them manually

## Prerequisites

Before installing this module, ensure that the Scorecard backend plugin is integrated into your Backstage instance. Follow the [Scorecard backend plugin README](../scorecard-backend/README.md) for setup instructions.

## Installation

To install this backend module:

```bash
# From your root directory
yarn workspace backend add @red-hat-developer-hub/backstage-plugin-scorecard-backend-module-catalog
```

```ts
// packages/backend/src/index.ts
import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();

// Scorecard backend plugin
backend.add(
  import('@red-hat-developer-hub/backstage-plugin-scorecard-backend'),
);

// Install the Catalog module
/* highlight-add-next-line */
backend.add(
  import(
    '@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-catalog'
  ),
);

backend.start();
```

## Configuration

All metrics are defined under `scorecard.metricProviders.catalog.requiredAttributes.options.metrics` in your `app-config.yaml`. The `metrics` key is an object where each key is a metric ID and each value specifies an entity filter, a dotted field path to evaluate, and an optional status mapping override.

If no metrics are configured, the module has no effect.

### Example 1: Required attribute metric

The simplest use case — verify that a field exists and is non-empty. Uses the default status mapping where existing fields map to `found` and missing/empty fields map to `missed`.

```yaml
# app-config.yaml
scorecard:
  metricProviders:
    catalog:
      requiredAttributes:
        options:
          metrics:
            title:
              title: Title is required
              description: Every component should have a human-readable title.
              filter:
                kind: Component
              field: metadata.title
```

This produces a single metric `catalog.title` that reports `found` when the entity has a non-empty `metadata.title`, or `missed` when it is absent, null, or empty.

### Example 2: Value whitelist metric

Verify that a field contains one of a set of accepted values. Values not in the whitelist are reported with the `exists` status (here overridden to `invalid`).

```yaml
# app-config.yaml
scorecard:
  metricProviders:
    catalog:
      requiredAttributes:
        options:
          metrics:
            lifecycle:
              title: Lifecycle must be a known value
              description: The spec.lifecycle field should be prod, stage, test, or dev.
              filter:
                kind: Component
              field: spec.lifecycle
              statusMapping:
                exists: invalid
                values:
                  prod: ok
                  stage: ok
                  test: ok
                  dev: ok
```

This produces metric `catalog.lifecycle` with three possible statuses:

| Field state                                | Status    |
| ------------------------------------------ | --------- |
| Value is `prod`, `stage`, `test`, or `dev` | `ok`      |
| Value exists but is not in the whitelist   | `invalid` |
| Field is missing, null, or empty           | `missed`  |

### Example 3: Multiple metrics with different entity kinds

Define multiple metrics targeting different entity kinds. The module aggregates kind filters for efficient catalog querying.

```yaml
# app-config.yaml
scorecard:
  metricProviders:
    catalog:
      requiredAttributes:
        options:
          metrics:
            title:
              title: Title is required
              description: Every component should have a human-readable title.
              filter:
                kind: Component
              field: metadata.title

            owner:
              title: Owner is required
              description: Every component should declare an owner.
              filter:
                kind: Component
              field: spec.owner

            templateOwner:
              title: Template owner is required
              description: Every template should declare an owner.
              filter:
                kind: Template
              field: spec.owner
```

This produces three metrics: `catalog.title`, `catalog.owner`, and `catalog.templateOwner`. The module automatically queries only Component and Template entities from the catalog.

### Example 4: Options-level status mapping defaults

Set default status strings for all metrics at the options level. Individual metrics can still override specific fields.

```yaml
# app-config.yaml
scorecard:
  metricProviders:
    catalog:
      requiredAttributes:
        options:
          statusMapping:
            exists: present
            empty: absent
            emptyString: absent
            emptyArray: absent
            missed: absent
          metrics:
            title:
              title: Title is required
              description: The metadata.title should be defined.
              filter:
                kind: Component
              field: metadata.title
              # Inherits options-level mapping: present/absent

            tags:
              title: Tags are required
              description: Components should have at least one tag.
              filter:
                kind: Component
              field: metadata.tags
              statusMapping:
                exists: present
                emptyArray: warning
                # Overrides only emptyArray; other states inherit from options-level
```

### Example 5: Metric with multi-field entity filter

Filter by multiple entity fields. All filter conditions must match (AND logic). Filter values are compared case-insensitively.

```yaml
# app-config.yaml
scorecard:
  metricProviders:
    catalog:
      requiredAttributes:
        options:
          metrics:
            serviceLifecycle:
              title: Service lifecycle is required
              description: Service components should have a lifecycle set.
              filter:
                kind: Component
                spec.type: service
              field: spec.lifecycle
```

This metric only runs against entities where `kind` is `Component` **and** `spec.type` is `service`.

### Example 6: Full configuration with schedule and per-metric thresholds

A comprehensive example combining schedule configuration, options-level defaults, multiple metrics, and per-metric threshold overrides.

```yaml
# app-config.yaml
scorecard:
  metricProviders:
    catalog:
      requiredAttributes:
        schedule:
          frequency:
            cron: '0 */2 * * *'
          timeout:
            minutes: 10
          initialDelay:
            seconds: 30

        options:
          statusMapping:
            exists: found
            missed: missed
          metrics:
            title:
              title: Title is required
              description: Every component should have a human-readable title.
              filter:
                kind: Component
              field: metadata.title

            lifecycle:
              title: Lifecycle must be valid
              description: The spec.lifecycle field should be one of the accepted values.
              filter:
                kind: Component
              field: spec.lifecycle
              statusMapping:
                exists: invalid
                values:
                  production: ok
                  experimental: warning
                  deprecated: warning

        metrics:
          lifecycle:
            thresholds:
              rules:
                - key: ok
                  expression: '==0'
                  color: 'success.main'
                  icon: scorecardSuccessStatusIcon
                - key: warning
                  expression: '==1'
                  color: 'warning.main'
                  icon: scorecardWarningStatusIcon
                - key: invalid
                  expression: '==2'
                  color: 'error.main'
                  icon: scorecardErrorStatusIcon
                - key: missed
                  expression: '==3'
                  color: 'error.main'
                  icon: scorecardErrorStatusIcon
```

## How It Works

### Field Resolution

Fields are resolved using dotted path notation on the entity object. For example, `metadata.title` resolves to `entity.metadata.title`, and `spec.lifecycle` resolves to `entity.spec.lifecycle`.

> **Note:** Dotted annotation keys (e.g., `backstage.io/source-location`) cannot be resolved directly because the path is split on `.`. Use annotations with non-dotted keys, or check a different field path.

### Status Evaluation

Each field value is evaluated against the metric's status mapping to produce a status string:

| Field state                                         | Status mapping key | Default status |
| --------------------------------------------------- | ------------------ | -------------- |
| Field exists with a non-empty value, no value match | `exists`           | `found`        |
| Field exists, value matches an entry in `values`    | `values.<value>`   | _(per value)_  |
| Field resolves to `null` or `undefined`             | `empty`            | `missed`       |
| Field resolves to an empty string (`""`)            | `emptyString`      | `missed`       |
| Field resolves to an empty array (`[]`)             | `emptyArray`       | `missed`       |
| Field path does not resolve on the entity           | `missed`           | `missed`       |

### Three-Tier Status Mapping Merge

Status mappings are resolved with the following priority:

1. **Metric-level** (`metrics.<id>.statusMapping`) — highest priority
2. **Options-level** (`options.statusMapping`) — middle priority
3. **Hardcoded defaults** — lowest priority (see table above)

Each field in the status mapping is resolved independently, so a metric can override just `exists` while inheriting the options-level `missed` value.

The `values` maps are deep-merged: hardcoded defaults (empty), then options-level values, then metric-level values. A metric-level entry for the same key wins over the options-level entry.

### Automatic Threshold Generation

The module automatically generates threshold rules from each metric's resolved status mapping. Each distinct status string becomes a threshold rule with a numeric code. Well-known status strings get default colors and icons:

| Status string                          | Color            | Icon                         |
| -------------------------------------- | ---------------- | ---------------------------- |
| `found`, `ok`, `success`, `valid`      | success (green)  | `scorecardSuccessStatusIcon` |
| `missed`, `invalid`, `error`, `failed` | error (red)      | `scorecardErrorStatusIcon`   |
| `warning`                              | warning (yellow) | `scorecardWarningStatusIcon` |
| _(any other)_                          | warning (yellow) | `scorecardWarningStatusIcon` |

You can override the auto-generated thresholds using per-metric threshold configuration (see Example 6).

## Available Metrics

### Catalog metric (`catalog.<id>`)

Each configured metric produces one numeric metric.

- **Metric ID**: `catalog.<id>` (where `<id>` is the key from the `metrics` object)
- **Provider ID**: `catalog.requiredAttributes`
- **Type**: Number (numeric code mapped to a status string via threshold rules)
- **Datasource**: `catalog`

## Schedule Configuration

The Scorecard plugin uses Backstage's built-in scheduler service to automatically collect metrics from all registered providers every hour by default. You can change this schedule in the `app-config.yaml` file:

```yaml
scorecard:
  metricProviders:
    catalog:
      requiredAttributes:
        schedule:
          frequency:
            cron: '0 6 * * *'
          timeout:
            minutes: 5
          initialDelay:
            seconds: 5
```

The schedule configuration follows Backstage's `SchedulerServiceTaskScheduleDefinitionConfig` [schema](https://github.com/backstage/backstage/blob/master/packages/backend-plugin-api/src/services/definitions/SchedulerService.ts#L157). For more details on how to configure schedule, see [Metric Collection Scheduling](../scorecard-backend/docs/providers.md#metric-collection-scheduling).

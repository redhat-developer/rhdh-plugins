# Thresholds Configuration

Thresholds define conditions to assign metric values to specific visual categories (`success`, `warning`, `error` or any custom category). When a metric value matches a threshold condition, it gets assigned to that threshold's category. The Scorecard plugin provides multiple ways to configure thresholds with a flexible priority system.

## Overview

Thresholds are evaluated in order and the **first matching** threshold rule is applied. Each threshold rule consists of:

- **`key`**: The threshold category (e.g., `success`, `warning`, `error`, or custom keys)
- **`expression`**: The condition that determines if a metric value matches this threshold
- **`color`** (optional): The color to display for this threshold in the UI (see [Threshold Colors](#threshold-colors))
- **`icon`** (optional): The icon to display for this threshold in the UI (see [Threshold Icons](#threshold-icons))

## Joint coverage (number metrics)

For **number** metrics with **two or more** rules, validation requires that the **union** of all rule expressions covers the **entire real line** (from negative infinity to positive infinity). This matches how the backend evaluates values: numeric ranges use **inclusive** endpoints. Comparison operators keep their usual strict or non-strict boundaries.

**Overlaps:** Overlapping intervals **do not** fail validation—the check only verifies that no **gap** remains. Rule **order** does not affect coverage. It only affects **which key wins** when more than one rule matches ([first-match semantics](#thresholdevaluator)).

### How validation works

For each rule, the validator parses the expression and maps it to one or more intervals on the real line:

- **Range** syntax `min-max` → closed interval `[min, max]`.
- **Comparisons** (`>`, `>=`, `<`, `<=`) → half-lines or bounded rays.
- **`==`** → a single point.
- **`!=`** → **two** intervals (everything except that point), which can help close gaps near a boundary without adding an extra rule.

All intervals from every rule are merged (overlapping or touching intervals combine). The configuration **passes** only if the merged result is a single interval covering **(-∞, +∞)** with both ends included.

### Gap detection and error messages

If the merged union leaves any real number uncovered, validation throws `ThresholdConfigFormatError` with a message similar to:

`Number threshold rules do not cover the entire real line. First uncovered region (approximately): …`

The reported interval is an **approximate** description of the **first** gap found (for example `(10, 11)`, `(-∞, 10)`, or `(74, 75)`). Adjust boundaries so adjacent rules meet or overlap—for example use **`10-20`** instead of **`11-20`** next to **`'<10'`**, or **`10-75`** with **`>=75`** instead of **`10-74`** with **`>=75`**.

**Gap example:** `success: '<10'`, `warning: '11-20'`, `error: '>20'` leaves **`10`** and **`(10, 11)`** uncovered. Prefer **`'<10'`**, **`'10-20'`**, **`'>20'`**, or widen ranges so neighbors touch (**`51-79`** with **`'<51'`** and **`'>=80'`**).

### When full-line coverage is skipped

Validation **does not** require full coverage when:

- The metric type is not **number**, or
- **`rules`** is empty, or
- There is **at most one** rule (for example validating a single expression in isolation), or
- **Every** rule is a numeric **`==`** expression (discrete metrics such as Sonar ratings **`==1`** … **`==5`**).

## Threshold Configuration Options

### 1. Provider Default Thresholds

Metric providers can define default thresholds that apply to all entities using that metric.

**Example Provider Implementation:**

```typescript
export class MyMetricProvider implements MetricProvider<'number'> {
  ...

  getMetricThresholds(): ThresholdConfig {
    return {
      rules: [
        { key: 'success', expression: '<10' },
        { key: 'warning', expression: '10-50' },
        { key: 'error', expression: '>50' },
      ],
    };
  }
}
```

### 2. App Configuration Thresholds

You can override provider defaults through app configuration (`app-config.yaml`). Your metric provider needs to support configuration-based thresholds.
Duplicated threshold keys are not allowed (throws `ConfigFormatError`).

**Provider Implementation:**

```typescript
import {
  MetricProvider,
  validateThresholdsForMetric,
  getThresholdsFromConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-node';

export class MyMetricProvider implements MetricProvider<'number'> {
  private readonly thresholds: ThresholdConfig;

  private constructor(thresholds?: ThresholdConfig) {
    // Use configured thresholds or fall back to defaults
    this.thresholds = thresholds ?? this.getDefaultThresholds();
  }

  static fromConfig(config: Config): MyMetricProvider {
    const configPath = 'scorecard.plugins.myDatasource.myMetric.thresholds';
    // Validates structure, colors/icons, expressions, and number interval coverage (when applicable)
    const configuredThresholds = getThresholdsFromConfig(
      config,
      configPath,
      'number',
    );

    return new MyMetricProvider(configuredThresholds);
  }

  getMetricThresholds(): ThresholdConfig {
    return this.thresholds;
  }
}
```

You can also call **`validateThresholdsForMetric(configuredThresholds, 'number')`** directly if you already have a config object (not reading from `Config`).

**Example App Configuration:**

```yaml
scorecard:
  plugins:
    myDatasource:
      myMetric:
        thresholds:
          rules:
            - key: success
              expression: '<10'
            - key: warning
              expression: '<=20'
            - key: error
              expression: '>20'
    myOtherDatasource:
      myOtherMetric: ...
```

### 3. Entity Annotation Overrides

Override thresholds for specific entities using annotations in the entity's metadata:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  annotations:
    # Override specific threshold rules for this entity
    scorecard.io/myDatasource.myMetric.thresholds.rules.warning: '10-15'
    scorecard.io/myDatasource.myMetric.thresholds.rules.error: '>15'
    # success threshold will use the default config value
spec:
  type: service
```

#### Annotation Format Reference

Entity annotations use this format:

```yaml
scorecard.io/{providerId}.thresholds.rules.{thresholdKey}: '{expression}'
```

Where:

- `{providerId}`: The metric provider ID (e.g., `github.open_prs`)
- `{thresholdKey}`: The threshold category (e.g., `success`, `warning`, `error`)
- `{expression}`: The threshold expression (e.g., `>10`, `==true`, `5-15`)

### 4. Aggregation KPI result thresholds (`average` type)

These thresholds are **not** per-entity metric rules. They apply only to homepage aggregation KPIs where **`scorecard.aggregationKPIs.<aggregationId>.type`** is **`average`**.

**Configuration path:** `scorecard.aggregationKPIs.<aggregationId>.options.thresholds`

**YAML shape:** Same as metric thresholds — a **`rules`** array of **`key`**, **`expression`**, and optional **`color`** (and optional **`icon`**, though icons are not used for the average KPI donut). Expressions are **number**-style and are evaluated against the **headline percentage** **`averageScore × 100`**, where **`averageScore`** is the backend’s portfolio ratio in **`[0, 1]`** (see [Entity Aggregation](./aggregation.md)). The **first** matching rule wins; its **`color`** is returned on the API as **`result.aggregationChartDisplayColor`**.

**Defaults:** If **`thresholds`** is omitted from app-config under **`options`**, it is not injected at config-parse time. **`AverageAggregationStrategy`** applies **`DEFAULT_AVERAGE_KPI_RESULT_THRESHOLDS`** from [`src/constants/aggregationKPIs.ts`](../src/constants/aggregationKPIs.ts) when serving an aggregation: **`<30`** → error, **`30-79`** → warning, **`>=80`** → success (higher percentage = better). When that default path is used, the strategy logs at **info** that the built-in 0–100% scale is in effect.

**Startup validation:** Invalid rules or expressions are caught when the backend plugin loads, together with the rest of **`scorecard.aggregationKPIs`**. Average KPI **`options.thresholds`** must also satisfy **joint full-line coverage** for number expressions (see [Joint coverage (number metrics)](#joint-coverage-number-metrics)), for example ensure ranges and comparison rules meet at boundaries (**`10-75`** with **`>=75`** and **`<10`**, not **`10-74`** with **`>=75`**, which would leave **`(74, 75)`** uncovered). See [aggregation.md — Configuration validation](./aggregation.md#configuration-validation).

**Further reading:** [Entity Aggregation](./aggregation.md) (`average` algorithm, API, drill-down); [Scorecard backend README — Aggregation KPIs](../README.md#aggregation-kpis-homepage-and-get-aggregations) (full **`aggregationKPIs`** example including **`statusScores`**).

## Threshold Priority Order

Thresholds are applied with the following priority (highest to lowest):

1. **Entity Annotations** (highest priority) - _merged_ with existing rules
2. **App Configuration** - _completely replaces_ provider defaults
3. **Provider Defaults** (lowest priority)

**Merging Behavior:**

- **App Configuration**: Completely replaces provider defaults (no merging), missing rules are not applied
- **Entity Annotations**: Merged with existing rules from `app-config` or defaults:
  - Rules with the same `key` are **replaced** by annotation values
  - Missing rules fall back to app-config or provider defaults

**Example Priority Application:**

```typescript
// 1. Provider defaults
providerDefaults: [
  { key: 'success', expression: '<10' },
  { key: 'warning', expression: '10-50' },
  { key: 'error', expression: '>50' }
]

// 2. App configuration (completely replaces defaults)
appConfig: [
  { key: 'success', expression: '<10' },
  { key: 'warning', expression: '10-30' },
  { key: 'error', expression: '>30' },
]

// 3. Entity annotation overrides (merged with app-config)
annotations: {
  'scorecard.io/myProviderId.thresholds.rules.warning': '10-25',
  'scorecard.io/myProviderId.thresholds.rules.error': '>25',
}

// Final result (annotations merged with app-config)
finalRules: [
  { key: 'success', expression: '<10' },   // from app-config
  { key: 'warning', expression: '10-25' }, // from annotation (overrides app-config)
  { key: 'error', expression: '>25' }, // from annotation (overrides app-config)
]
```

## Threshold Expressions

### Supported Operators

#### Comparison Operators

- `>`: Greater than
- `>=`: Greater than or equal to
- `<`: Less than
- `<=`: Less than or equal to
- `==`: Equal to
- `!=`: Not equal to

#### Range Operator

- `-`: Value within range (min-max, inclusive)

### Number Metric

Supports operators: `>, >=, <, <=, ==, !=, -`. The **`!=`** operator matches every value except the given number; in coverage validation it contributes **two** intervals, which can help eliminate small gaps at boundaries when combined with other rules.

Example:

```yaml
rules:
  - key: error
    expression: '>100'
  - key: warning
    expression: '80-100' # between 80 and 100 (inclusive)
  - key: success
    expression: '<80'
```

### Boolean Metric

Supports operators: `==, !=`.

```yaml
rules:
  - key: success
    expression: '==true'
  - key: error
    expression: '==false'

  # Alternative (equivalent)
  - key: success
    expression: '!=false'
  - key: error
    expression: '!=true'
```

## Threshold Colors

You can customize the color displayed for each threshold rule in the scorecard UI. Colors can be specified using predefined constants (`success.main`, `warning.main`, `error.main`), hex codes, or RGB/RGBA values.

### Color Configuration

Add a `color` property to any threshold rule:

```yaml
scorecard:
  plugins:
    myDatasource:
      myMetric:
        thresholds:
          rules:
            - key: success
              expression: '<10'
              color: 'success.main'
            - key: warning
              expression: '10-50'
              color: '#FFA500'
            - key: error
              expression: '>50'
              color: 'rgb(255, 0, 0)'
```

### Predefined Color Constants

You can use the following predefined constants in your color configuration:

- **`success.main`** - Maps to `theme.palette.success.main` (green)
- **`warning.main`** - Maps to `theme.palette.warning.main` (orange/yellow)
- **`error.main`** - Maps to `theme.palette.error.main` (red)

Example configuration:

```yaml
scorecard:
  plugins:
    myDatasource:
      myMetric:
        thresholds:
          rules:
            - key: low
              expression: '<50'
              color: success.main
            - key: medium
              expression: '50-79'
              color: warning.main
            - key: high
              expression: '80-100'
              color: error.main
```

### Default Colors

If no color is specified for a threshold rule, frontend will use these default colors for standard threshold rule keys:

| Rule Key | Color                          |
| -------- | ------------------------------ |
| success  | `success.main` (green)         |
| warning  | `warning.main` (orange/yellow) |
| error    | `error.main` (red)             |

**Important:** Custom threshold keys (not `success`, `warning`, or `error`) **must** specify a `color` property. The configuration will fail validation if a custom key is used without a color. This requirement ensures that all thresholds can be properly visualized in the UI.

## Threshold Icons

You can customize the icon displayed for each threshold rule in the scorecard UI by adding an `icon` property.

### Icon Configuration

Add an `icon` property to any threshold rule:

```yaml
scorecard:
  plugins:
    myDatasource:
      myMetric:
        thresholds:
          rules:
            - key: success
              expression: '<10'
              icon: scorecardSuccessStatusIcon
            - key: warning
              expression: '10-50'
              icon: '<svg xmlns="http://www.w3.org/2000/svg">...</svg>'
            - key: error
              expression: '>50'
              icon: 'customIcon'
```

### Supported Icon Formats

The `icon` value is a string and can be one of:

- **Backstage System Icon**: `kind:component`, `kind:api`, your `customIcon` registered with Backstage
- **Material Design Icon**: `settings`, `home`, `build`
- **SVG String**: `<svg xmlns="http://www.w3.org/2000/svg">...</svg>`
- **Image URL**: `http(s)://...`, `/assets/icon.svg`
- **Data URI**: `data:image/svg+xml;base64,...`

> [!NOTE]
> SVG String, Image URL, and Data URI icons are treated as images and do not inherit the threshold status color. You must define the color within the icon itself.

For information on registering custom icons with Backstage, see [Adding Icons](https://backstage.io/docs/conf/user-interface/icons/#adding-icons).
To use your custom Backstage System icons in RHDH for Scorecard, you will need to add `appIcons` key to the plugin that is exporting them:

```yaml
dynamicPlugins:
  rootDirectory: dynamic-plugins-root
  frontend:
    example.plugin-custom:
      appIcons:
        - name: customIcon
          importName: CustomIcon
```

### Default icons

If no icon is specified for a threshold rule, the frontend uses default icons for standard threshold rule keys:

| Rule Key | Default icon constant        | Material Design Icon |
| -------- | ---------------------------- | -------------------- |
| success  | `scorecardSuccessStatusIcon` | CheckCircleOutline   |
| warning  | `scorecardWarningStatusIcon` | WarningAmber         |
| error    | `scorecardErrorStatusIcon`   | DangerousOutlined    |

**Important:** Custom threshold keys (not `success`, `warning`, or `error`) **must** specify an `icon` property. The configuration will fail validation if a custom key is used without an icon. This requirement ensures that all thresholds can be properly visualized in the UI.

## ThresholdEvaluator

The `ThresholdEvaluator` service processes threshold rules and determines which threshold a metric value matches.

### Key Features

1. **Order-dependent evaluation**: Rules are evaluated in the order they appear. If provider supports overriding defaults through [app configuration](#App-Configuration-Thresholds), you can change the evaluation order by specifying threshold keys in a different order. Entity annotations cannot alter the evaluation order, which is determined by either the [app configuration](#Provider-Default-Thresholds) or, if not specified, the [default provider configuration](#Provider-Default-Thresholds).
2. **First-match wins**: Returns the first threshold rule whose condition the value satisfies
3. **Type-safe**: Validates expressions against metric types
4. **Error handling**: Validate expressions loaded from config in custom providers using **`validateThresholdsForMetric`** or **`getThresholdsFromConfig`** from `@red-hat-developer-hub/backstage-plugin-scorecard-node`. Invalid expressions or gap configurations fail at validation time; unchecked configs may error at evaluation time.

### Best Practices

### 1. Logical Ordering

Order rules from most restrictive to least restrictive.

In this example, the `success` rule would never be triggered because any value smaller than 15 would already match the `warning` rule (since it is evaluated first). As a result, all values under 15 would be classified as `warning` instead of `success`:

```yaml
rules:
  - key: warning
    expression: '<30'
  - key: success
    expression: '<15'
  - key: error
    expression: '>30'
```

### 2. Overlaps vs gaps

**Joint coverage** allows overlapping intervals—only **gaps** cause validation to fail. Overlaps do affect **runtime** behavior: the **first** matching rule in list order wins ([Logical Ordering](#1-logical-ordering)). If overlaps are unintentional, reorder or narrow rules so the intended category matches first.

## Related documentation

- [Entity Aggregation](./aggregation.md) — ownership, **`GET /aggregations/:aggregationId`**, **`statusGrouped`** vs **`average`**
- [Drill-down](./drill-down.md) — entity list for a metric (`metricId`, not KPI id)
- [Scorecard backend README](../README.md) — install, RBAC, **`aggregationKPIs`** examples

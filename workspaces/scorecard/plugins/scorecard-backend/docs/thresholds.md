# Thresholds Configuration

Thresholds define conditions that determine which category a metric value belongs to ( `error`, `warning`, or `success`). When a metric value matches a threshold condition, it gets assigned to that threshold's category. The Scorecard plugin provides multiple ways to configure thresholds with a flexible priority system.

## Overview

Thresholds are evaluated in order and the **first matching** threshold rule is applied. Each threshold rule consists of:

- **`key`**: The threshold category (only allowed keys are `error`, `warning`, `success`)
- **`expression`**: The condition that determines if a metric value matches this threshold

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
        { key: 'error', expression: '>50' },
        { key: 'warning', expression: '10-50' },
        { key: 'success', expression: '<10' },
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
  validateThresholds,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-node';

export class MyMetricProvider implements MetricProvider<'number'> {
  private readonly thresholds: ThresholdConfig;

  private constructor(thresholds?: ThresholdConfig) {
    // Use configured thresholds or fall back to defaults
    this.thresholds = thresholds ?? this.getDefaultThresholds();
  }

  static fromConfig(config: Config): MyMetricProvider {
    const configPath = 'scorecard.plugins.myDatasource.myMetric.thresholds';
    const configuredThresholds = config.getOptional(configPath);

    if (configuredThresholds) {
      // validate threshold configuration is correct, throws ConfigFormatError if not
      validateThresholds(configuredThresholds, 'number');
    }

    return new MyMetricProvider(configuredThresholds);
  }

  getMetricThresholds(): ThresholdConfig {
    return this.thresholds;
  }
}
```

**Example App Configuration:**

```yaml
scorecard:
  plugins:
    myDatasource:
      myMetric:
        thresholds:
          rules:
            - key: error
              expression: '>20'
            - key: warning
              expression: '>10'
            - key: success
              expression: '<=10'
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
    scorecard.io/myDatasource.myMetric.thresholds.rules.error: '>15'
    scorecard.io/myDatasource.myMetric.thresholds.rules.warning: '>8'
    # success threshold will use the default/config value
spec:
  type: service
```

#### Annotation Format Reference

Entity annotations use this format:

```yaml
scorecard.io/{providerId}.thresholds.rules.{thresholdKey}: '{expression}'
```

Where:

- `{providerId}`: The metric provider ID (e.g., `github.open-prs`)
- `{thresholdKey}`: The threshold category (e.g., `error`, `warning`, `success`)
- `{expression}`: The threshold expression (e.g., `>10`, `==true`, `5-15`)

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
  { key: 'error', expression: '>10' },
  { key: 'warning', expression: '>5' },
  { key: 'success', expression: '<=5' }
]

// 2. App configuration (completely replaces defaults)
appConfig: [
  { key: 'error', expression: '>20' },
  { key: 'warning', expression: '>10' },
  { key: 'success', expression: '<=10' }
]

// 3. Entity annotation overrides (merged with app-config)
annotations: {
  'scorecard.io/myProvider.thresholds.rules.error': '>25',
}

// Final result (annotations merged with app-config)
finalRules: [
  { key: 'error', expression: '>25' }, // from annotation (overrides app-config)
  { key: 'warning', expression: '>10' }, // from app-config
  { key: 'success', expression: '<=10' }   // from app-config
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

Supports operators: `>, >=, <, <=, ==, !=, -`.

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

## ThresholdEvaluator

The `ThresholdEvaluator` service processes threshold rules and determines which threshold a metric value matches.

### Key Features

1. **Order-dependent evaluation**: Rules are evaluated in the order they appear
2. **First-match wins**: Returns the first threshold rule whose condition the value satisfies
3. **Type-safe**: Validates expressions against metric types
4. **Error handling**: Graceful handling of invalid expressions. You should validate your expressions loaded from config in your custom providers using `validateThresholds` from `backstage-plugin-scorecard-node`. Invalid annotation expressions are logged and skipped (do not override)

### Best Practices

### 1. Logical Ordering

Order rules from most restrictive to least restrictive.

In this example, the `error` rule would never be triggered because any value greater than 20 would already match the `warning` rule (since it is evaluated first). As a result, all values above 50 would be classified as `warning` instead of `error`:

```yaml
rules:
  - key: warning
    expression: '>20'
  - key: error
    expression: '>50'
  - key: success
    expression: '<=20'
```

### 2. Avoid Overlapping Ranges

Ensure threshold ranges don't create gaps or unexpected behavior.

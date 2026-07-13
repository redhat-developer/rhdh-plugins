# Scorecard Backend Module: SonarQube

Adds SonarQube / SonarCloud metrics to the scorecard plugin.

## Metrics

| Metric ID                          | Type    | Description                                      |
| ---------------------------------- | ------- | ------------------------------------------------ |
| `sonarqube.quality_gate`           | boolean | Whether the project passes its quality gate      |
| `sonarqube.open_issues`            | number  | Count of open issues (OPEN, CONFIRMED, REOPENED) |
| `sonarqube.security_rating`        | number  | Security rating                                  |
| `sonarqube.security_issues`        | number  | Count of open security vulnerabilities           |
| `sonarqube.security_review_rating` | number  | Security review rating                           |
| `sonarqube.security_hotspots`      | number  | Count of security hotspots to review             |
| `sonarqube.reliability_rating`     | number  | Reliability rating                               |
| `sonarqube.reliability_issues`     | number  | Count of open bugs                               |
| `sonarqube.maintainability_rating` | number  | Maintainability rating                           |
| `sonarqube.maintainability_issues` | number  | Count of open code smells                        |
| `sonarqube.code_coverage`          | number  | Overall code coverage percentage                 |
| `sonarqube.code_duplications`      | number  | Percentage of duplicated lines                   |

## Installation

```bash
yarn workspace backend add @red-hat-developer-hub/backstage-plugin-scorecard-backend-module-sonarqube
```

Then register the module in your backend:

```ts
backend.add(
  import(
    '@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-sonarqube'
  ),
);
```

## Entity annotation

Entities need the `sonarqube.org/project-key` annotation:

```yaml
metadata:
  annotations:
    sonarqube.org/project-key: my-project-key
```

### Multiple instances

If you have multiple SonarQube instances configured, prefix the project key with the instance name:

```yaml
metadata:
  annotations:
    sonarqube.org/project-key: my-instance/my-project-key
```

When no instance prefix is provided, the default instance configuration is used.

## Default thresholds

Default thresholds vary by metric. See [threshold configuration](../scorecard-backend/docs/thresholds.md) for custom configuration.

### `sonarqube.quality_gate` (boolean)

Default thresholds for `sonarqube.quality_gate`:

```yaml
# app-config.yaml
scorecard:
  plugins:
    sonarqube:
      quality_gate:
        thresholds:
          rules:
            - key: success
              expression: '==true'
            - key: error
              expression: '==false'
```

### Count metrics (lower is better)

Default thresholds for `sonarqube.open_issues`:

```yaml
# app-config.yaml
scorecard:
  plugins:
    sonarqube:
      open_issues:
        thresholds:
          rules:
            - key: success
              expression: '<1'
            - key: warning
              expression: '1-10'
            - key: error
              expression: '>10'
```

| Metric                             | Success | Warning | Error |
| ---------------------------------- | ------- | ------- | ----- |
| `sonarqube.open_issues`            | `<1`    | `1-10`  | `>10` |
| `sonarqube.security_issues`        | `<1`    | `1-5`   | `>5`  |
| `sonarqube.security_hotspots`      | `<1`    | `1-5`   | `>5`  |
| `sonarqube.reliability_issues`     | `<1`    | `1-5`   | `>5`  |
| `sonarqube.maintainability_issues` | `<10`   | `10-50` | `>50` |

Replace the metric name in the path above for the metrics in this table (e.g. `security_issues`, `security_hotspots`). Use the same `scorecard.plugins.sonarqube.<metric>.thresholds` structure as `open_issues`.

### Rating metrics (`security_rating`, `security_review_rating`, `reliability_rating`, `maintainability_rating`)

All four rating metrics share the same default thresholds. Default thresholds for `sonarqube.security_rating` (custom keys `A`–`E` require `color` and `icon` in app-config):

```yaml
# app-config.yaml
scorecard:
  plugins:
    sonarqube:
      security_rating:
        thresholds:
          rules:
            - key: A
              expression: '==1'
              color: 'success.main'
              icon: scorecardSuccessStatusIcon
            - key: B
              expression: '==2'
              color: '#bdcb28'
              icon: scorecardSuccessStatusIcon
            - key: C
              expression: '==3'
              color: 'warning.main'
              icon: scorecardWarningStatusIcon
            - key: D
              expression: '==4'
              color: '#cf5813'
              icon: scorecardErrorStatusIcon
            - key: E
              expression: '==5'
              color: 'error.main'
              icon: scorecardErrorStatusIcon
```

Replace `security_rating` with `security_review_rating`, `reliability_rating`, or `maintainability_rating` for the other rating metrics.

### Percentage metrics

Default thresholds for `sonarqube.code_coverage` (higher is better):

```yaml
# app-config.yaml
scorecard:
  plugins:
    sonarqube:
      code_coverage:
        thresholds:
          rules:
            - key: success
              expression: '>80'
            - key: warning
              expression: '50-80'
            - key: error
              expression: '<50'
```

Default thresholds for `sonarqube.code_duplications` (lower is better):

```yaml
# app-config.yaml
scorecard:
  plugins:
    sonarqube:
      code_duplications:
        thresholds:
          rules:
            - key: success
              expression: '<3'
            - key: warning
              expression: '3-10'
            - key: error
              expression: '>10'
```

## Configuration

Configuration is optional for public SonarCloud projects. The base URL defaults to `https://sonarcloud.io`.

### Default instance

```yaml
# app-config.yaml
sonarqube:
  baseUrl: https://sonarcloud.io # optional, defaults to https://sonarcloud.io
  apiKey: ${SONARQUBE_API_KEY} # optional for public projects
```

### Multiple instances

```yaml
# app-config.yaml
sonarqube:
  baseUrl: https://sonarcloud.io
  apiKey: ${SONARQUBE_DEFAULT_KEY}
  instances:
    - name: internal
      baseUrl: https://sonar.internal.com
      apiKey: ${SONARQUBE_INTERNAL_KEY}
      authType: Bearer # optional, defaults to Basic
    - name: cloud
      baseUrl: https://sonarcloud.io
      # apiKey optional for public SonarCloud projects (omit if not needed)
```

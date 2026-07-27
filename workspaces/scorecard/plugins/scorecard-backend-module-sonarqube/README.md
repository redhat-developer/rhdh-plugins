# Scorecard Backend Module: SonarQube

Adds SonarQube / SonarCloud metrics to the scorecard plugin.

## Metrics

| Metric ID                         | Type    | Description                                      |
| --------------------------------- | ------- | ------------------------------------------------ |
| `sonarqube.qualityGate`           | boolean | Whether the project passes its quality gate      |
| `sonarqube.openIssues`            | number  | Count of open issues (OPEN, CONFIRMED, REOPENED) |
| `sonarqube.securityRating`        | number  | Security rating                                  |
| `sonarqube.securityIssues`        | number  | Count of open security vulnerabilities           |
| `sonarqube.securityReviewRating`  | number  | Security review rating                           |
| `sonarqube.securityHotspots`      | number  | Count of security hotspots to review             |
| `sonarqube.reliabilityRating`     | number  | Reliability rating                               |
| `sonarqube.reliabilityIssues`     | number  | Count of open bugs                               |
| `sonarqube.maintainabilityRating` | number  | Maintainability rating                           |
| `sonarqube.maintainabilityIssues` | number  | Count of open code smells                        |
| `sonarqube.codeCoverage`          | number  | Overall code coverage percentage                 |
| `sonarqube.codeDuplications`      | number  | Percentage of duplicated lines                   |

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

### `sonarqube.qualityGate` (boolean)

Default thresholds for `sonarqube.qualityGate`:

```yaml
# app-config.yaml
scorecard:
  plugins:
    sonarqube:
      qualityGate:
        thresholds:
          rules:
            - key: success
              expression: '==true'
            - key: error
              expression: '==false'
```

### Count metrics (lower is better)

Default thresholds for `sonarqube.openIssues`:

```yaml
# app-config.yaml
scorecard:
  plugins:
    sonarqube:
      openIssues:
        thresholds:
          rules:
            - key: success
              expression: '<1'
            - key: warning
              expression: '1-10'
            - key: error
              expression: '>10'
```

| Metric                            | Success | Warning | Error |
| --------------------------------- | ------- | ------- | ----- |
| `sonarqube.openIssues`            | `<1`    | `1-10`  | `>10` |
| `sonarqube.securityIssues`        | `<1`    | `1-5`   | `>5`  |
| `sonarqube.securityHotspots`      | `<1`    | `1-5`   | `>5`  |
| `sonarqube.reliabilityIssues`     | `<1`    | `1-5`   | `>5`  |
| `sonarqube.maintainabilityIssues` | `<10`   | `10-50` | `>50` |

Replace the metric name in the path above for the metrics in this table (e.g. `securityIssues`, `securityHotspots`). Use the same `scorecard.plugins.sonarqube.<metric>.thresholds` structure as `openIssues`.

### Rating metrics (`securityRating`, `securityReviewRating`, `reliabilityRating`, `maintainabilityRating`)

All four rating metrics share the same default thresholds. Default thresholds for `sonarqube.securityRating` (custom keys `A`–`E` require `color` and `icon` in app-config):

```yaml
# app-config.yaml
scorecard:
  plugins:
    sonarqube:
      securityRating:
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

Replace `securityRating` with `securityReviewRating`, `reliabilityRating`, or `maintainabilityRating` for the other rating metrics.

### Percentage metrics

Default thresholds for `sonarqube.codeCoverage` (higher is better):

```yaml
# app-config.yaml
scorecard:
  plugins:
    sonarqube:
      codeCoverage:
        thresholds:
          rules:
            - key: success
              expression: '>80'
            - key: warning
              expression: '50-80'
            - key: error
              expression: '<50'
```

Default thresholds for `sonarqube.codeDuplications` (lower is better):

```yaml
# app-config.yaml
scorecard:
  plugins:
    sonarqube:
      codeDuplications:
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

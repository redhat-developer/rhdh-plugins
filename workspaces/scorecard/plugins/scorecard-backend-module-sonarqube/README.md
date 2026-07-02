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

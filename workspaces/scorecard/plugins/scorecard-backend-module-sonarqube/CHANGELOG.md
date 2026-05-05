# @red-hat-developer-hub/backstage-plugin-scorecard-backend-module-sonarqube

## 0.1.1

### Patch Changes

- 5148408: Migrated to Jest 30 as required by @backstage/cli 0.36.0.
- Updated dependencies [5148408]
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.7.3
  - @red-hat-developer-hub/backstage-plugin-scorecard-node@2.7.3

## 0.1.0

### Minor Changes

- 04e95fe: Add metric providers for code coverage, code duplications, security review rating, security hotspots, reliability rating, reliability issues, maintainability rating, and maintainability issues
- 04e95fe: Add SonarQube metric providers for quality gate status, open issues, security rating, and security issues

### Patch Changes

- 04e95fe: Fix Basic auth to base64-encode apiKey with appended colon, matching the SonarQube API expectation
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.7.2
  - @red-hat-developer-hub/backstage-plugin-scorecard-node@2.7.2

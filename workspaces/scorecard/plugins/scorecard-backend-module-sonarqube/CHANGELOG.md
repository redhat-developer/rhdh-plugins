# @red-hat-developer-hub/backstage-plugin-scorecard-backend-module-sonarqube

## 0.1.4

### Patch Changes

- 5115044: ### Threshold validation

  Implemented threshold interval validation for Scorecard: joint coverage on the real line, gap detection and error messages, and overlap handling versus rule order (including aggregation KPI `options.thresholds` for `average`).

  ### Aggregation

  For **`type: average`** aggregations, **`result.averageScore`** returned by **`GET /aggregations/:aggregationId`** (and the same shape wherever it appears) is a **portfolio percentage in \[0, 100\]** with **one decimal place** — the same scale used for **`options.thresholds`** evaluation and the homepage donut.

  Previously **`averageScore`** was a **normalized ratio in \[0, 1\]** (rounded to **three** decimal places). Any consumer that treated the old value as a fraction and multiplied by **100** for display, or compared it to thresholds on a 0–100 scale without converting, must **stop scaling**: use **`averageScore`** directly as the percentage. If you stored historical API payloads, recompute or re-fetch rather than assuming the old fractional scale.

- Updated dependencies [5115044]
  - @red-hat-developer-hub/backstage-plugin-scorecard-node@2.7.5
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.7.5

## 0.1.3

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-scorecard-common@2.7.4
- @red-hat-developer-hub/backstage-plugin-scorecard-node@2.7.4

## 0.1.2

### Patch Changes

- da00ded: Bumped Backstage dependencies to 1.49.4 for RHDH 1.10 compatibility.

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

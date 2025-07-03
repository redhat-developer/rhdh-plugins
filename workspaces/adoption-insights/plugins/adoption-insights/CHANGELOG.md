# @red-hat-developer-hub/backstage-plugin-adoption-insights

## 0.2.1

### Patch Changes

- 38372b3: Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.9.0`.
- 586901c: Timezone Fixes for Consistent Data Grouping and Display

  - Backend now accepts an explicit timezone parameter from the frontend instead of relying on Intl.DateTimeFormat().resolvedOptions().timeZone.
  - This eliminates discrepancies between frontend simulation and backend processing.
  - Accurate Date Range Construction
  - Updated PostgreSQL query to respect user timezone.
  - Tooltips now show formatted times based on user's selected timeszone.

## 0.2.0

### Minor Changes

- 3a80c30: Backstage version bump to v1.39.1

### Patch Changes

- 3f93232: Updated dependency `@mui/icons-material` to `5.17.1`.
  Updated dependency `@mui/material` to `5.17.1`.
  Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.8.0`.
- Updated dependencies [3a80c30]
  - @red-hat-developer-hub/backstage-plugin-adoption-insights-common@0.3.0

## 0.1.0

### Minor Changes

- a66e0b0: Backstage version bump to v1.36.1

### Patch Changes

- Updated dependencies [a66e0b0]
  - @red-hat-developer-hub/backstage-plugin-adoption-insights-common@0.2.0

## 0.0.4

### Patch Changes

- 16ecc8f: Updated dependency `@mui/lab` to `5.0.0-alpha.176`.

## 0.0.3

### Patch Changes

- 6922e2b: Improved error management for API failures

## 0.0.2

### Patch Changes

- 480aa8e: Release Adoption insights plugin
- Updated dependencies [480aa8e]
  - @red-hat-developer-hub/backstage-plugin-adoption-insights-common@0.1.1

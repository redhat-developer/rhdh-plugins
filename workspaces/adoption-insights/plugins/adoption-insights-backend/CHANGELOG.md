# @red-hat-developer-hub/backstage-plugin-adoption-insights-backend

## 0.4.1

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-adoption-insights-common@0.4.1

## 0.3.0

### Minor Changes

- 6673ba3: Backstage version bump to v1.42.5

### Patch Changes

- Updated dependencies [6673ba3]
  - @red-hat-developer-hub/backstage-plugin-adoption-insights-common@0.4.0

## 0.2.2

### Patch Changes

- 2b1a830: Fixed Timezone offset inconsistency in time-based SQLite grouping queries

## 0.2.1

### Patch Changes

- 9c0b135: Audit logging support
- 8ea6f37: Ensure Dates created for partitioning always are created with the UTC timezone
- 586901c: Timezone Fixes for Consistent Data Grouping and Display

  - Backend now accepts an explicit timezone parameter from the frontend instead of relying on Intl.DateTimeFormat().resolvedOptions().timeZone.
  - This eliminates discrepancies between frontend simulation and backend processing.
  - Accurate Date Range Construction
  - Updated PostgreSQL query to respect user timezone.
  - Tooltips now show formatted times based on user's selected timeszone.

- 742d79e: fixed an issue for the last month of the year introduced in the previous MR

## 0.2.0

### Minor Changes

- 3a80c30: Backstage version bump to v1.39.1

### Patch Changes

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

- 1e6eff6: Fix partition overlap error

## 0.0.3

### Patch Changes

- 808a0a4: fix subquery alias in total_users endpoint

## 0.0.2

### Patch Changes

- 480aa8e: Release Adoption insights plugin
- Updated dependencies [480aa8e]
  - @red-hat-developer-hub/backstage-plugin-adoption-insights-common@0.1.1

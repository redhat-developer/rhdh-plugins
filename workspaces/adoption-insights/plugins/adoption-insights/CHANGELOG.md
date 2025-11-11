# @red-hat-developer-hub/backstage-plugin-adoption-insights

## 0.4.1

### Patch Changes

- d3ab6a9: fixed scaling issues
  - @red-hat-developer-hub/backstage-plugin-adoption-insights-common@0.4.1

## 0.3.2

### Patch Changes

- f86957a: Improve card styling consistency with Backstage design system

  - Remove explicit borders from CardWrapper component to match standard Backstage card styling
  - Replace custom border styling with Material-UI Paper elevation system for consistent visual appearance
  - Update Divider component to use default styling without custom borders

## 0.3.1

### Patch Changes

- fb54d82: safely parse the date so it works in different Node.js/browser environments

## 0.3.0

### Minor Changes

- 2470f72: Add internationalization (i18n) support with German and French translations.
- 6673ba3: Backstage version bump to v1.42.5

### Patch Changes

- 192c262: Update label from techdocs to TechDocs in UI
- 67e9f96: Fixed CSV export filename to include timestamp for better file identification and to avoid naming conflicts. Active Users CSV exports now use format "active_users_YYYY-MM-DD_HH-mm-ss-SSS.csv" instead of generic "active_users"
- 25fcc52: Pagination and title consistency improvements:

  - Fixed dynamic "Top X" pagination options to adapt to actual item count, resolving misleading filter options when dataset is smaller than defaults
  - Added "All" option for datasets smaller than maxDefaultOption (20 items)
  - Improved component title consistency across the UI

- e7f6aba: Fixed Adoption Insights header background color by removing custom background style override that was causing wrong theming
- 617de8b: - Fixed confusing text in ActiveUsers and Searches components by replacing "were conducted" with professional analytics terminology
  - Updated text to use "Average peak active user count" and "Average search count" for better clarity
  - Enhanced time period text to properly handle all grouping types (hourly, daily, weekly, monthly) instead of only supporting hour and day
- 0dd7b78: Align legends in Active users card, display trends on initial load, and remove empty space in no results card
- b887a58: French translation updated
- 5eeb69a: Updated dependency `@mui/lab` to `5.0.0-alpha.177`.
  Updated dependency `date-fns-tz` to `1.3.8`.
- 86cf463: Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.10.0`.
- c2501eb: Updated dependency `@mui/icons-material` to `5.18.0`.
  Updated dependency `@mui/material` to `5.18.0`.
- Updated dependencies [6673ba3]
  - @red-hat-developer-hub/backstage-plugin-adoption-insights-common@0.4.0

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

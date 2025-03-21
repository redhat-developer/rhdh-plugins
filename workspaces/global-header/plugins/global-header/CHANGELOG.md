# @red-hat-developer-hub/backstage-plugin-global-header

## 1.2.0

### Minor Changes

- 3099c9c: Added a new starred dropdown to global header which shows all the starred entities.

### Patch Changes

- c658469: Emit search analytics events for search and discover events

## 1.1.0

### Minor Changes

- 612bc20: Renaming the 'Create' to 'Self-service'

### Patch Changes

- 680ede5: Updated dependency `@mui/icons-material` to `5.16.14`.
  Updated dependency `@mui/styles` to `5.16.14`.
  Updated dependency `@mui/material` to `5.16.14`.
  Updated dependency `@mui/styled-engine` to `5.16.14`.

## 1.0.0

### Major Changes

- 005fa36: Release 1.0.0

## 0.2.0

### Minor Changes

- e19aed1: Remove ComponmentType to simplify API and add layout prop to the header components to support some responsive design tweaks in dynamic plugin config. Moved some local styles to the incl. app config as well and hide the username on xs and sm screen sizes.

## 0.1.0

### Minor Changes

- f35b797: First version of Global Header plugin with the following components:

  - GlobalHeaderComponent
  - SearchComponent
  - CreateDropdown
    - SoftwareTemplatesSection
    - RegisterAComponentSection
  - ProfileDropdown
    - LogoutButton
  - HeaderButton
  - HeaderIcon
  - HeaderIconButton
  - MenuItemLink
  - Spacer
  - Divider
  - NotificationBanner

## 0.0.4

### Patch Changes

- a07a84a: Update dependencies to Backstage 1.35.0
- 02cd530: add new mountpoints for the search, create dropdown, profile dropdown, software templates, register a component, logout button, header link and header icon

## 0.0.3

### Patch Changes

- 4959ebb: add new notificationbanner component

## 0.0.2

### Patch Changes

- 08db379: Updated dependencies version to match rhdh, and fixed some UI issues

## 0.0.1

### Patch Changes

- 086841f: First release of global-header plugin

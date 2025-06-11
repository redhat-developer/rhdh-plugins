# @red-hat-developer-hub/backstage-plugin-global-header

## 1.10.0

### Minor Changes

- e4996c9: Backstage version bump to v1.39.1

## 1.9.0

### Minor Changes

- 3a9b336: Backstage version bump to v1.39.0

## 1.8.0

### Minor Changes

- dfc984b: Added Company Logo component

## 1.7.3

### Patch Changes

- 106af07: Updated dependency `@mui/styles` to `5.17.1`.
  Updated dependency `@mui/icons-material` to `5.17.1`.
  Updated dependency `@mui/material` to `5.17.1`.

## 1.7.2

### Patch Changes

- e1914ce: Updated dependency `@scalprum/react-core` to `0.9.5`.

## 1.7.1

### Patch Changes

- d2711c4: fix global-header to prioritize 'spec.profile.displayname' or 'metadata.title' over profilename

## 1.7.0

### Minor Changes

- 0bd2f82: **Breaking change**: Use new theme package. Global header items will now use the `theme.rhdh?.general.appBarForegroundColor` colour if defined, and fall back to `theme.palette.text.primary`. This may cause your global header to not look correct in light mode when using the legacy theme.

## 1.6.0

### Minor Changes

- f0f1eb6: Added avatar to the Profile dropdown

## 1.5.1

### Patch Changes

- 9ad7f38: Fixed profile dropdown username to match the User Profile name in the Settings page

## 1.5.0

### Minor Changes

- 72cf928: Add keyboard navigation support to global header menu items

### Patch Changes

- 41ebaf4: remove search bar underline

## 1.4.0

### Minor Changes

- ba8628d: Added a new application launcher dropdown to the global header which can be used to configure application links and quick links.

## 1.3.0

### Minor Changes

- d49d965: Backstage version bump to v1.36.1

### Patch Changes

- 9562fd9: changing `Logout` text to `Sign Out`

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

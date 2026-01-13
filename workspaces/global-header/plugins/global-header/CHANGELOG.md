# @red-hat-developer-hub/backstage-plugin-global-header

## 1.20.1

### Patch Changes

- 350a081: Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.12.0`.
- 322c6ad: Updated dependency `@scalprum/react-core` to `0.11.1`.
  Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.11.0`.
- f74564d: Added 'ja' i18n support and updated 'it' and 'fr' translation strings.

## 1.20.0

### Minor Changes

- 3f708c9: Backstage version bump to v1.45.2

### Patch Changes

- 40b80fe: Remove "support", "lifecycle" keywords and "supported-versions" in package.json. Change "lifecycle" to active in catalog.yaml

## 1.19.0

### Minor Changes

- 7982d37: Backstage version bump to v1.44.2

## 1.18.2

### Patch Changes

- e8b5090: fix: add ability to use custom star icons

## 1.18.1

### Patch Changes

- 927b031: Make the myProfile check backward compatible for customers with a custom header configuration

## 1.18.0

### Minor Changes

- 97011bd: Adding translation support for the string coming through configuration

## 1.17.3

### Patch Changes

- b887a58: French translation updated

## 1.17.2

### Patch Changes

- 4e2f33e: Fix the test package build and rebuild both packages to have a consistant commit for them.
- 2c4b3c0: Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.10.0`.

## 1.17.1

### Patch Changes

- d59b616: Add `type` prop for MenuItemLink identification and hide "My profile" menuItemLink for guest users

  - Add `type` prop to MenuItemLink component config for better identification when i18n applied
  - Hide "My Profile" menu item when user entity reference contains '/guest'
  - Hide "My Profile" menu item when catalog API fails to fetch user entity
  - Export `globalHeaderTranslations` from plugin for i18n integration

## 1.17.0

### Minor Changes

- d59f08b: Backstage version bump to v1.42.5

## 1.16.1

### Patch Changes

- 60a37b4: Fixes the global header starred items icon color and visibility:

  - Changed star icon color to use theme.rhdh.general.starredItemsColor for better visibility and customization
  - Star icon now only appears on hover instead of being always visible
  - Maintains consistent styling with table view starred items across the application

## 1.16.0

### Minor Changes

- 6d86c5c: Add internationalization (i18n) support with German, French, Italian, and Spanish translations.

### Patch Changes

- cf9f6d0: Fixed dropdown empty state corners by removing the border line

## 1.15.1

### Patch Changes

- aaaaf2d: Add divider above Sign out option in profile dropdown for better visual separation
- b991a8a: Show empty state when no help items available

## 1.15.0

### Minor Changes

- afcac0c: Backstage version bump to v1.41.1

## 1.14.1

### Patch Changes

- 01f38dc: Updated dependency `@mui/styles` to `5.18.0`.
  Updated dependency `@mui/icons-material` to `5.18.0`.
  Updated dependency `@mui/material` to `5.18.0`.
  Updated dependency `@mui/styled-engine` to `5.18.0`.

## 1.14.0

### Minor Changes

- 7eb9524: - Add suuport for closing Help dropdown on menu-item click and removed QuickstartButton to better align with quickstart context.

## 1.13.0

### Minor Changes

- ba5e13c: Add dynamic profile link support to ProfileDropdown based on current user identity.

## 1.12.0

### Minor Changes

- 667e8c2: **BREAKING**: The `CompanyLogo` prop `logoWidth` has been renamed to `width`.

  Allow configuring `width` and `height` for `CompanyLogo` via configuration. When `width` is not specified, `CompanyLogo` will now fall back to using the value from `app.branding.fullLogoWidth`.

- 5000863: **BREAKING**: `SupportButton` is now a `MenuItem` and `style` config prop can be used to update color, size and other required css properties.

  Add `HelpDropdown` in global header plugin.

- 5638ede: Add QuickstartButton to global header plugin

## 1.11.2

### Patch Changes

- 25fd302: Remove the CompanyLogo `max-width` and align the rendered image to the left
- 4200b27: Updated the default mount points and dynamic plugin config to include application launcher quick links.

## 1.11.1

### Patch Changes

- ce4ffa7: Update config.d.ts to expect the updated app-config schema

## 1.11.0

### Minor Changes

- 8e33ca2: Updated the `CompanyLogo` component to support global headers either light or dark background colours. The light/dark mode of the logo is determined by the `theme.palette.rhdh.general.appBarBackgroundScheme` field in the theme configuration.

  The `logo` prop now also accepts an object with `light` and `dark` properties, each containing a string URL for the logo image. If `logo` is a string, it will be used for both light and dark modes.

  The `CompanyLogo` will prefer the `config.props.logo.[light|dark]` mount point configuration when rendering. If not provided, it will fall back to the `app.branding.fullLogo` in the app configuration.

  Moreover, `app.branding.fullLogo` is now an object with `light` and `dark` properties, each containing a string URL for the logo image. If `app.branding.fullLogo` is a string, it will be used for both light and dark modes.

  If neither `config.props.logo` nor `app.branding.fullLogo` is provided, the `CompanyLogo` will render the Red Hat Developer Hub logo by default.

### Patch Changes

- 8e33ca2: Update the Red Hat Developer Hub logo to align with the [brand guidelines](https://www.redhat.com/en/about/brand/standards/product-logos)

## 1.10.1

### Patch Changes

- df2776b: Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.9.0`.
  Removed the shadow underline when the search box is focused.
  Changed the `Divider` border color to inherit instead of using a hardcoded value.

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

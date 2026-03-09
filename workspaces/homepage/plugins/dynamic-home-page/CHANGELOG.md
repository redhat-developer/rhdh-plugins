# @red-hat-developer-hub/backstage-plugin-dynamic-home-page

## 1.10.6

### Patch Changes

- b0d352a: Fixed entity cards in "Explore Your Software Catalog" section to display `metadata.title` when available, falling back to `metadata.name` only if title is not set

## 1.10.5

### Patch Changes

- 802696c: UI polish and tag interaction improvements on Home page

## 1.10.4

### Patch Changes

- 2f39369: Fix inconsistent usage of resource kind chip on template homepage

## 1.10.3

### Patch Changes

- f74564d: Added 'it' and 'ja' i18n support and updated 'fr' translation strings.
- 21d555b: Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.12.0`.
- b4c913a: Updated dependency `react-router-dom` to `6.30.3`.

## 1.10.2

### Patch Changes

- 777de64: Updated dependency `@scalprum/react-core` to `0.11.1`.
  Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.11.0`.

## 1.10.1

### Patch Changes

- 1d11800: Updated dependency `react-grid-layout` to `1.5.3`.
  Updated dependency `tss-react` to `4.9.20`.

## 1.10.0

### Minor Changes

- 2998c31: Backstage version bump to v1.45.3

### Patch Changes

- c6c029b: allow base64 image in quick access icons
- 09c378a: Updated dependency `react-router-dom` to `6.30.2`.
  Updated dependency `@types/react-grid-layout` to `1.3.6`.

## 1.9.4

### Patch Changes

- 4758d94: allow base64 image in quick access icons

## 1.9.3

### Patch Changes

- b62354f: Fixes an issue with the customizable home page that cards of the same mount point could not be displayed multiple times.

  To enable this feature it is still required to change the home page mount point to `DynamicCustomizableHomePage`.

  For these customizations the mount points requires also a `config.id` (unique identifier) and `config.title` to be displayed in the "Add widget" dialog. An additional `config.description` can be configured as well.

  When customization is disabled mount points with an `config.layout` and these without a `config.id` for backward compatibility will be shown.

- 40b80fe: Change "lifecycle" to active in catalog.yaml

## 1.9.2

### Patch Changes

- 52f82ec: update quickaccess card's icon rendering logic
- b8fb354: Updated dependency `@testing-library/jest-dom` to `6.9.1`.

## 1.9.1

### Patch Changes

- dd5350f: French translation updated

## 1.9.0

### Minor Changes

- 1e6b861: Add customizable homepage functionality with drag, drop, resize, and widget management capabilities

## 1.8.0

### Minor Changes

- 8b64e16: Add internationalization (i18n) support with German, French, Italian, and Spanish translations.

### Patch Changes

- a994094: Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.10.0`.

## 1.7.0

### Minor Changes

- 7ebc8d3: Backstage version bump to v1.42.5

### Patch Changes

- 670728c: Updated dependency `@testing-library/jest-dom` to `6.8.0`.

## 1.6.0

### Minor Changes

- 02ab635: Backstage version bump to v1.41.2

## 1.5.5

### Patch Changes

- 518a20a: Added external link icon to Read documentaion and updated homepage greetings
- 4fc279c: Updated dependency `@testing-library/jest-dom` to `6.7.0`.

## 1.5.4

### Patch Changes

- 1e01b31: Updated dependency `@testing-library/jest-dom` to `6.6.4`.

## 1.5.3

### Patch Changes

- 36c64da: Fixed homepage title which was not respecting the title received through configuration.

## 1.5.2

### Patch Changes

- 041b242: Updated dependency `@mui/icons-material` to `5.18.0`.
  Updated dependency `@mui/material` to `5.18.0`.
  Updated dependency `@mui/styles` to `5.18.0`.
- 9dc8c46: Updated dependency `tss-react` to `4.9.19`.

## 1.5.1

### Patch Changes

- 3282796: Default homepage cards update to new design
- 33ab96f: Updated dependency `react-grid-layout` to `1.5.2`.

## 1.5.0

### Minor Changes

- 6681eb9: Bump to backstage version 1.39.1

### Patch Changes

- 4face49: Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.9.0`.

## 1.4.2

### Patch Changes

- 002f7c9: Updated dependency `@testing-library/user-event` to `14.6.1`.
- 593ed08: Updated dependency `@mui/icons-material` to `5.17.1`.
  Updated dependency `@mui/material` to `5.17.1`.
  Updated dependency `@mui/styles` to `5.17.1`.
  Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.8.0`.

## 1.4.1

### Patch Changes

- 70fe697: Updated dependency `@scalprum/react-core` to `0.9.5`.
  Updated dependency `tss-react` to `4.9.18`.
  Updated dependency `react-router-dom` to `6.30.1`.

## 1.4.0

### Minor Changes

- 8915566: added new homepage cards - explore, catalog and templates

## 1.3.3

### Patch Changes

- 93e16a8: Correcting the home page title for `Recent Visits` and `Top Visits` on initial load and page reload.
- f691b55: Updated dependency `tss-react` to `4.9.17`.

## 1.3.2

### Patch Changes

- a9e5f32: Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.6.0`.

## 1.3.1

### Patch Changes

- a5b2c24: Updated dependency `tss-react` to `4.9.16`.
- 00db670: Updated dependency `react-grid-layout` to `1.5.1`.

## 1.3.0

### Minor Changes

- d602553: Backstage version bump to v1.36.1

## 1.2.0

### Minor Changes

- a75760c: add the ability to let users customize their homepage grid layout using the [Backstage Customizable homepage component](https://github.com/backstage/backstage/blob/master/plugins/home/README.md#customizable-home-page).

  This change does not affect the original `HomePage` as it introduces this new capability through new components. So, the user has a choice of choosing its HomePage implementation via the plugin configuration (dynamic routes).

### Patch Changes

- 1a25bba: Updated dependency `react-router-dom` to `6.30.0`.
- 3dce00f: Updated dependency `react-router-dom` to `6.29.0`.
- 680ede5: Updated dependency `@mui/icons-material` to `5.16.14`.
  Updated dependency `@mui/styles` to `5.16.14`.
  Updated dependency `@mui/material` to `5.16.14`.
  Updated dependency `@mui/styled-engine` to `5.16.14`.

## 1.1.0

### Minor Changes

- 4d622ad: - Added support to show also the the username (`displayName` from the user catalog entity) in the header title.
  - Added additional options to show the local time and a worldclock to the header.
  - Added a new `WorldClock` card based on the Home plugin `HeaderWorldClock` component to show additional clocks/timezones also in the home page content area.
- c376011: Upgrade Backstage from 0.32.0 to 1.35.0

### Patch Changes

- 34c138c: Updated dependency `react-router-dom` to `6.28.2`.
- bc85b86: Updated dependency `tss-react` to `4.9.15`.

## 1.0.3

### Patch Changes

- f627fd2: Updated dependency `@mui/icons-material` to `5.16.13`.
  Updated dependency `@mui/material` to `5.16.13`.
  Updated dependency `@mui/styles` to `5.16.13`.
- 7374542: Updated dependency `react-router-dom` to `6.28.1`.

## 1.0.2

### Patch Changes

- 552dd0e: Updated dependency `react-grid-layout` to `1.5.0`.
- e9e670c: Updated dependency `@mui/material` to `5.16.11`.
  Updated dependency `@mui/styles` to `5.16.11`.
- 18547a0: Updated dependency `msw` to `1.3.5`.
- 531bd4b: Updated dependency `react-router-dom` to `6.28.0`.
- d6c3908: Updated dependency `tss-react` to `4.9.14`.
- f534007: Updated dependency `react-use` to `17.6.0`.

## 1.0.1

### Patch Changes

- 849e0c7: Update dependencies (@scalprum/react-core from 0.8 to 0.9 and tss-react)

## 1.0.0

### Major Changes

- a5e2e8e: prepare support for top and recently visited cards

## 0.0.1

### Patch Changes

- 0de827a: Migrate dynamic-home-page plugin from showcase

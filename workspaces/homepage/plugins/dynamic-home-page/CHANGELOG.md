# @red-hat-developer-hub/backstage-plugin-dynamic-home-page

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

# @red-hat-developer-hub/backstage-plugin-theme

## 0.9.0

### Minor Changes

- c353c97: Bump to backstage version 1.39.1

## 0.8.3

### Patch Changes

- 142818d: Added `theme.rhdh.general.pageInset` option for easier customizability. Removed broken global header styles.

## 0.8.2

### Patch Changes

- 275d8b1: Support above-sidebar postiion for global header

## 0.8.1

### Patch Changes

- cf40352: Add CSS for global header

## 0.8.0

### Minor Changes

- 8f9be66: Add support to load the theme as dynamic plugin

## 0.7.0

### Minor Changes

- 7db4caa: Align BackstageHeader, Backstage/MUI Breadcrumbs, BackstageSidebar, and BackstagePage with PF6
- 7db4caa: **Breaking change**: remove deprecated general.sideBarBackgroundColor
- 33b6dd1: Align primary color, buttons and tabs styling with PatternFly 6. Add styling for :focus-visible on the tabs.

## 0.6.0

### Minor Changes

- 97ffc75: Backstage version bump to v1.36.1

### Patch Changes

- b1fc395: Some UI bug fix.

## 0.5.0

### Minor Changes

- a571f32: Upgrade Backstage from 0.32.0 to 1.35.0

### Patch Changes

- 106b3d0: Fixing fontColor error while customizing rhdh appearance

## 0.4.9

### Patch Changes

- b6efba4: fix font loading after migrating theme

## 0.4.8

### Patch Changes

- 370d9b1: move the mui v5 package to a peer dependency to ensure that we don't load it twice
- 67de15b: added a workaround so that `defaultProps` are also picked up from MUI v5 components (like Button disabledRipple or Grid spacing)

## 0.4.7

### Patch Changes

- 5ff9b79: add missing shadow to action menus/dropdowns that uses the Popover component

## 0.4.6

### Patch Changes

- 715c448: add workaround for `style-inject`(ion) issue with the published package

## 0.4.5

### Patch Changes

- 15aa207: add workaround for `style-inject`(ion) issue with the published package

## 0.4.4

### Patch Changes

- f2fad21: removes all drop shadow from MUI v4 Papers and add missing border for MUI v5 Papers
- f2fad21: fix/remove different paper background colors/shades in MUI v5
- a62d5b8: Add hover style to tabs, move vertical tabs indicator to left to match PF style.

## 0.4.3

### Patch Changes

- 1de5006: fix `sideEffect` typo to load Red Hat font

## 0.4.2

### Patch Changes

- 93b7ee8: align disabled tabs background color more with patternfly (5 for now)
- d92dc06: remove bottom border and vertical padding from vertical tabs

## 0.4.1

### Patch Changes

- 037324e: fixed that all disabled elements used a disable background color instead of just disabled tabs
- ee1085e: Fixed Mui v5 outlined button missing outline and causes other buttons move on hover issue.

## 0.4.0

### Minor Changes

- b1a511a: Migrate the 0.4.x theme that was already released as @redhat-developer/red-hat-developer-hub-theme@0.4.0. It is based on the latest changes in https://github.com/redhat-developer/red-hat-developer-hub-theme/tree/10cdcbe60dea6e60aca4550a88fab8c30536c295/src/themes/rhdh.

## 0.3.0

### Minor Changes

- cecd842: Migrate the 0.3.x theme with the 1.3.x RHDH theme. It's based on @redhat-developer/red-hat-developer-hub-theme@0.3.0 and the sourcecode is migrated from https://github.com/redhat-developer/red-hat-developer-hub-theme/tree/1cd29db2abb807f94a2edb09688157b316bf6ff8/src/themes/rhdh and aligned with linter and prettier rules in rhdh-plugins.

## 0.2.2

### Patch Changes

- 4cd05dd: Add `sideEffects` configuration to allow the plugin to load the Red Hat font.

## 0.2.1

### Patch Changes

- 9d6e7b2: Migrate the 0.2.x theme with the latest 1.2.x RHDH theme. It's based on @redhat-developer/red-hat-developer-hub-theme@0.1.7 and the sourcecode is migrated from https://github.com/redhat-developer/red-hat-developer-hub-theme/tree/147ec09221a4440177e1bf89260c188041de7a79/src/themes/rhdh and aligned with linter and prettier rules in rhdh-plugins.

## 0.2.0

### Minor Changes

- bf40004: This version contains the initial theme from RHDH 1.2

## 0.1.0

### Minor Changes

- 5692219: This version contains the initial theme from RHDH 1.1 https://github.com/janus-idp/backstage-showcase/tree/v1.1.0/packages/app/src/themes

## 0.0.1

### Patch Changes

- 8be31d3: This version contains the initial theme from RHDH 1.0 https://github.com/janus-idp/backstage-showcase/tree/v1.0.0/packages/app/src/themes

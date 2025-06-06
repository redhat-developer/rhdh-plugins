# @red-hat-developer-hub/backstage-plugin-marketplace-common

## 0.4.0

### Minor Changes

- 7d138e5: Added extension permissions
- f56908a: Introduces GET endpoints for dynamic plugins configuration: `/package/:namespace/:name/configuration` and `/plugin/:namespace/:name/configuration`. Introduces optional config value `extensions.installation` which is used for installation configuration.

### Patch Changes

- 4413eef: updated `extension` to `extensions`
  update marketplace pluginId to extensions

## 0.3.0

### Minor Changes

- 6501387: Backstage version bump to v1.36.1

## 0.2.0

### Minor Changes

- d3bcc76: rename apiVersion and annotations to extensions.backstage.io

## 0.1.2

### Patch Changes

- a7e38a9: remove core-plugin-api dependency from common

## 0.1.1

### Patch Changes

- fa70a22: remove unused knex and zod dependency from common package

## 0.1.0

### Minor Changes

- d39d4e3: Initial tech-preview of the marketplace

### Patch Changes

- f16dd69: Refactore and update API, UI, and catalog types

## 0.0.9

### Patch Changes

- f310add: add documentation and asset types

## 0.0.8

### Patch Changes

- 4e0ec06: add optional sorting, filtering, pagination to marketplace api

## 0.0.7

### Patch Changes

- 9a3c185: replace custom aggregation api endpoint with catalog entity-facets api

## 0.0.6

### Patch Changes

- 0bcb97f: add Package entity

## 0.0.5

### Patch Changes

- 381a250: Upgrade Backstage from 1.32.0 to 1.35.0

## 0.0.4

### Patch Changes

- 113ff0d: Add new aggregation api in marketplace

## 0.0.3

### Patch Changes

- 58c2d47: Add new endpoints in marketplace.

## 0.0.2

### Patch Changes

- 8c442b6: align dependancies versions with backstage 1.32.0

## 0.0.1

### Patch Changes

- 56f9484: release marketplace plugin

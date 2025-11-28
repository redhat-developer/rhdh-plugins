# @red-hat-developer-hub/backstage-plugin-lightspeed-common

## 1.0.4

### Patch Changes

- 58e26ba: '@red-hat-developer-hub/backstage-plugin-lightspeed' :
  - Added missing translations for untranslated labels across the Lightspeed chat UI.
  - Added lightspeed settings kebab menu
  - Added a new “Pinned” section. The section is conditionally visible only when pinning chats are enabled in Lightspeed settings. It shows an empty state when no chats are pinned.
  - Added Kebab menu actions to each chat item with actions: Rename, Pin, Unpin
  - Implemented logic to move chats between Pinned and Recent sections based on the selected action (“Pin” / “Unpin”).
  - Updated search behavior to show results under both Pinned and Recent groups (when enabled), including appropriate empty search messaging.
  - The Rename action opens a dialog with an editable text field and confirm/cancel actions.
  - Replaced the patternfly components with MUI to match the Figma designs [Design 1](https://www.figma.com/design/urwU8VqRvHfbxMqxeVknrv/RHDH-Lightspeed---AI-Assistant?node-id=1523-1670&t=CqnUYsxar0PtjAjZ-0)
    [Design 2](https://www.figma.com/design/urwU8VqRvHfbxMqxeVknrv/RHDH-Lightspeed---AI-Assistant?node-id=2514-5415&t=PphIEOl5Yzmgv5tI-0)

  '@red-hat-developer-hub/backstage-plugin-lightspeed-common':

  Added the Update api client

- 40b80fe: Remove "lifecycle" keywords and "supported-versions" in package.json. Change "lifecycle" to active in catalog.yaml

## 1.0.3

## 1.0.2

## 0.4.0

### Minor Changes

- d922b04: Backstage version bump to v1.42.5

## 0.3.4

### Patch Changes

- 0e00cb6: Upgrade backstage to 1.39.1

## 0.3.3

### Patch Changes

- a79f849: Updated dependency `prettier` to `3.6.2`.

## 0.3.2

### Patch Changes

- 5d80736: Renamed permissions to align with the updated naming convention:
  - `lightspeed.conversations.read` → `lightspeed.chat.read`
  - `lightspeed.conversations.create` → `lightspeed.chat.create`
  - `lightspeed.conversations.delete` → `lightspeed.chat.delete`

## 0.3.1

### Patch Changes

- a9e5f32: Updated dependency `@openapitools/openapi-generator-cli` to `2.20.0`.
  Updated dependency `prettier` to `3.5.3`.
  Updated dependency `@redhat-developer/red-hat-developer-hub-theme` to `0.5.1`.
  Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.6.0`.
  Updated dependency `@janus-idp/cli` to `3.5.0`.

## 0.3.0

### Minor Changes

- 91a66a8: Backstage version bump to v1.35.1

## 0.2.1

### Patch Changes

- 8001249: fix dynamic plugins packaging

## 0.2.0

### Minor Changes

- e41a860: Backstage version bump to v1.34.2

## 0.1.3

### Patch Changes

- d59e940: Updated dependency `prettier` to `3.4.2`.

## 0.1.2

### Patch Changes

- 5f6faba: update peer dependancies

## 0.1.1

### Patch Changes

- c113d1a: add rbac permission support

## @red-hat-developer-hub/backstage-plugin-lightspeed

## 1.0.0

### Major Changes

- 2204143: Align lightspeed UI with LCS

## 0.6.1

### Patch Changes

- 51c5897: Export i18n resources from alpha module

## 0.6.0

### Minor Changes

- 693c3df: Add internationalization (i18n) support with German, French and Spanish translations in lightspeed.
- d922b04: Backstage version bump to v1.42.5

### Patch Changes

- cfa3434: Updated dependency `@patternfly/chatbot` to `6.3.2`.
  Updated dependency `@patternfly/react-core` to `6.3.1`.
- Updated dependencies [d922b04]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@0.4.0

## 0.5.7

### Patch Changes

- 0e00cb6: Upgrade backstage to 1.39.1
- Updated dependencies [0e00cb6]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@0.3.4

## 0.5.6

### Patch Changes

- 2ba3742: Add feedback API endpoints and controls in the UI to collect user feedback
- bab4647: Update functional and legal disclaimers
- 9133ae8: Add description in message source card
- a79f849: Updated dependency `prettier` to `3.6.2`.
- Updated dependencies [a79f849]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@0.3.3

## 0.5.5

### Patch Changes

- 5d80736: Renamed permissions to align with the updated naming convention:
  - `lightspeed.conversations.read` → `lightspeed.chat.read`
  - `lightspeed.conversations.create` → `lightspeed.chat.create`
  - `lightspeed.conversations.delete` → `lightspeed.chat.delete`

- 936c52c: Update the plugin name to Developer lightspeed
- 717c505: change the lightspeed user and bot avatars
- Updated dependencies [5d80736]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@0.3.2

## 0.5.4

### Patch Changes

- 555ef5b: Added support for Drag and Drop attachment upload
- ee1da3b: enable only supported file types in file picker
- 13dd7b1: Updated dependency `@patternfly/chatbot` to `6.3.0-prerelease.20`.
  Updated dependency `@patternfly/react-core` to `6.3.0-prerelease.17`.
- 717a32b: Updated dependency `@patternfly/react-core` to `6.3.0-prerelease.16`.
- 6495f17: Make source card links as external links

## 0.5.3

### Patch Changes

- b3cca2b: Reset localstorage if the conversations are empty

## 0.5.2

### Patch Changes

- fe413e3: Functional disclaimer with topic restriction
- a9e5f32: Updated dependency `@openapitools/openapi-generator-cli` to `2.20.0`.
  Updated dependency `prettier` to `3.5.3`.
  Updated dependency `@redhat-developer/red-hat-developer-hub-theme` to `0.5.1`.
  Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.6.0`.
  Updated dependency `@janus-idp/cli` to `3.5.0`.
- 3a76aaf: Updated dependency `@patternfly/react-core` to `6.3.0-prerelease.4`.
- 002f7c9: Updated dependency `@testing-library/user-event` to `14.6.1`.
- ab6a532: Add configurable sample prompts
- dc4ff7c: Add file attachment support
  Update functional and legal disclaimers
  Add citation links in the bot response
  Update initial user prompts
- db3257b: Upgrade PF chatbot
- Updated dependencies [a9e5f32]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@0.3.1

## 0.5.1

### Patch Changes

- e6c1643: Pause autoscroll when user scrolls up during streaming chat responses

## 0.5.0

### Minor Changes

- f9d1bc4: Align with road-core service API response

## 0.4.3

### Patch Changes

- f406790: Bump PF chatbot version

## 0.4.2

### Patch Changes

- 5fcce0c: Bumped Patternfly and chatbot versions

## 0.4.1

### Patch Changes

- 5d5904b: Remove CSS resets from PatternFly CSS import

## 0.4.0

### Minor Changes

- 91a66a8: Backstage version bump to v1.35.1

### Patch Changes

- Updated dependencies [91a66a8]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@0.3.0

## 0.3.3

### Patch Changes

- 0b0eec1: Make lightspeed conversation drawer resizable and default to closed on smaller screens

## 0.3.2

### Patch Changes

- 8001249: fix dynamic plugins packaging
- Updated dependencies [8001249]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@0.2.1

## 0.3.1

### Patch Changes

- 66c4da3: Updated dependency `@patternfly/chatbot` to `2.2.0-prerelease.10`.

## 0.3.0

### Minor Changes

- e41a860: Backstage version bump to v1.34.2

### Patch Changes

- Updated dependencies [e41a860]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@0.2.0

## 0.2.5

### Patch Changes

- 7b21401: Upgrade to latest PF chatbot version
- 9556c86: Persist last conversation state and reload on user revisit
- 18547a0: Updated dependency `msw` to `1.3.5`.
- d59e940: Updated dependency `prettier` to `3.4.2`.
- Updated dependencies [d59e940]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@0.1.3

## 0.2.4

### Patch Changes

- Updated dependencies [5f6faba]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@0.1.2

## 0.2.3

### Patch Changes

- 0cb862f: rename janus references in README.md

## 0.2.2

### Patch Changes

- 193645a: add delete confirmation modal during chat delete

## 0.2.1

### Patch Changes

- dd818f9: fix crash when switching between conversation during streaming

## 0.2.0

### Minor Changes

- c113d1a: - add RBAC permission support.
  - add multiple chats, chat creation, deletion and searching. [#2501](https://github.com/janus-idp/backstage-plugins/pull/2501)

### Patch Changes

- Updated dependencies [c113d1a]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@0.1.1

## 0.1.3

### Patch Changes

- 9fccf3f: Migrated from [janus-idp/backstage-plugins](https://github.com/janus-idp/backstage-plugins).

### Features

- **lightspeed:** add a new lightspeed plugin with basic implementation of chat ([#1889](https://github.com/janus-idp/backstage-plugins/issues/1889)) ([cb80e38](https://github.com/janus-idp/backstage-plugins/commit/cb80e38d4d35a8097cd84b57c1b8eb12ec5af6b4))
- **lightspeed:** add api client ([#2020](https://github.com/janus-idp/backstage-plugins/issues/2020)) ([ff09574](https://github.com/janus-idp/backstage-plugins/commit/ff095742c542869c7a330d391bd619e97473218c))

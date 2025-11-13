# @red-hat-developer-hub/backstage-plugin-lightspeed-backend

## 1.0.2

### Patch Changes

- c5fa204: Updated dependency `@types/express` to `4.17.25`.
  Updated dependency `msw` to `2.11.6`.
  Updated dependency `@patternfly/chatbot` to `6.4.1`.
  Updated dependency `@patternfly/react-core` to `6.4.0`.
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@1.0.2

## 1.0.1

### Patch Changes

- 4fcf3d4: update the question validation prompt

## 1.0.0

### Major Changes

- c6e4f39: migrate from road-core to lightspeed-core

### Patch Changes

- 2204143: Align lightspeed UI with LCS

## 0.6.0

### Minor Changes

- d922b04: Backstage version bump to v1.42.5

### Patch Changes

- 4786755: Updated dependency `msw` to `2.11.3`.
- 1bbd3c2: Updated dependency `@langchain/openai` to `^0.6.0`.
  Updated dependency `msw` to `2.11.1`.
- Updated dependencies [d922b04]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@0.4.0

## 0.5.7

### Patch Changes

- d703c31: introduce systemPrompt config for user to change and override default system prompt

## 0.5.6

### Patch Changes

- 0e00cb6: Upgrade backstage to 1.39.1
- Updated dependencies [0e00cb6]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@0.3.4

## 0.5.5

### Patch Changes

- 2ba3742: Add feedback API endpoints and controls in the UI to collect user feedback
- a79f849: Updated dependency `prettier` to `3.6.2`.
- Updated dependencies [a79f849]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@0.3.3

## 0.5.4

### Patch Changes

- 5d80736: Renamed permissions to align with the updated naming convention:
  - `lightspeed.conversations.read` → `lightspeed.chat.read`
  - `lightspeed.conversations.create` → `lightspeed.chat.create`
  - `lightspeed.conversations.delete` → `lightspeed.chat.delete`

- d51643f: Make Lightspeed service port configurable
- 7ca64e4: Updated dependency `msw` to `2.10.2`.
- Updated dependencies [5d80736]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@0.3.2

## 0.5.3

### Patch Changes

- 4db7d36: Updated dependency `msw` to `2.8.7`.
- 5f129c4: Updated dependency `@types/express` to `4.17.23`.

## 0.5.2

### Patch Changes

- 1704cd9: Updated dependency `msw` to `2.7.6`.
- a9e5f32: Updated dependency `@openapitools/openapi-generator-cli` to `2.20.0`.
  Updated dependency `prettier` to `3.5.3`.
  Updated dependency `@redhat-developer/red-hat-developer-hub-theme` to `0.5.1`.
  Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.6.0`.
  Updated dependency `@janus-idp/cli` to `3.5.0`.
- 174e08c: Updated dependency `node-fetch` to `2.7.0`.
- 571d93e: Updated dependency `@types/express` to `4.17.22`.
- Updated dependencies [a9e5f32]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@0.3.1

## 0.5.1

### Patch Changes

- d6bbaa9: Updated dependency `@langchain/openai` to `^0.5.0`.

## 0.5.0

### Minor Changes

- 0d6deb0: Updated @backstage/backend-test-utils to 1.3.0 and @backstage/repo-tools to 1.13.0

## 0.4.1

### Patch Changes

- 9fa7890: Updated dependency `msw` to `2.7.3`.

## 0.4.0

### Minor Changes

- 91a66a8: Backstage version bump to v1.35.1

### Patch Changes

- Updated dependencies [91a66a8]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@0.3.0

## 0.3.3

### Patch Changes

- 8001249: fix dynamic plugins packaging
- Updated dependencies [8001249]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@0.2.1

## 0.3.2

### Patch Changes

- dc61798: Updated dependency `@langchain/core` to `^0.3.0`.

## 0.3.1

### Patch Changes

- e0ef375: Updated dependency `@langchain/openai` to `^0.3.0`.

## 0.3.0

### Minor Changes

- e41a860: Backstage version bump to v1.34.2

### Patch Changes

- Updated dependencies [e41a860]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@0.2.0

## 0.2.2

### Patch Changes

- 5e4bdd2: Updated dependency `msw` to `2.7.0`.
- d59e940: Updated dependency `prettier` to `3.4.2`.
- 414250a: Updated dependency `msw` to `2.6.8`.
- Updated dependencies [d59e940]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@0.1.3

## 0.2.1

### Patch Changes

- Updated dependencies [5f6faba]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@0.1.2

## 0.2.0

### Minor Changes

- c113d1a: - add RBAC permission support
  - list all conversations for logged in users and generate conversation summary. [#2465](https://github.com/janus-idp/backstage-plugins/pull/2465)
  - add conversation create API endpoint. [#2403](https://github.com/janus-idp/backstage-plugins/pull/2403)
  - add streaming support in chat completion API. [#2238](https://github.com/janus-idp/backstage-plugins/pull/2238)
  - add conversation GET and DELETE API endpoints. [#2211](https://github.com/janus-idp/backstage-plugins/pull/2211)
  - Lightspeed backend plugin [#2115](https://github.com/janus-idp/backstage-plugins/pull/2115)

### Patch Changes

- Updated dependencies [c113d1a]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@0.1.1

## 0.1.1

### Patch Changes

- 9fccf3f: Migrated from [janus-idp/backstage-plugins](https://github.com/janus-idp/backstage-plugins).

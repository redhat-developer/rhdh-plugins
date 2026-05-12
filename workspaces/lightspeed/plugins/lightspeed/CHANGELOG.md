## @red-hat-developer-hub/backstage-plugin-lightspeed

## 2.7.1

### Patch Changes

- 75181f0: preserve indentation for lists in chat window
- ca793d5: Disable automatic model refetch on window focus to prevent unnecessary network requests
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.7.1

## 2.7.0

### Minor Changes

- 41c1901: Implemented fullscreen chat UX updates including:
  - Collapsible history panel with new expand/collapse icons
  - Redesigned message bar with inline model selector and attachment menu
  - New collapsed history strip with quick new chat functionality
  - Updated header with Lightspeed logo
  - Improved conversation list with hover-only options menu

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.7.0

## 2.6.8

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.6.8

## 2.6.7

### Patch Changes

- 3d2854b: fixed tool call response
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.6.7

## 2.6.6

### Patch Changes

- c6824df: fixed notebooks empty state backgroundColor
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.6.6

## 2.6.5

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.6.5

## 2.6.4

### Patch Changes

- cab4992: Internationalize the Lightspeed floating action button: tooltip and `aria-label` use `tooltip.fab.open` / `tooltip.fab.close`, with German, Spanish, French, Italian, and Japanese translations.
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.6.4

## 2.6.3

### Patch Changes

- d4d74cf: ### Lightspeed shell and Notebooks
  - **Fullscreen**: Chat and Notebooks stay on separate tabs. While the Notebooks tab is active, chat-only header actions (for example chat history, pinned chats, and MCP settings) are hidden so the header matches the active surface.
  - **Overlay and docked**: Only the **Chat** surface is shown; the Chat/Notebooks tab strip is not shown, because Notebooks is intended for the fullscreen experience only.
  - **Leaving fullscreen from Notebooks**: If you switch from fullscreen while on Notebooks to overlay or docked, you land on **Chat** in the shell, and the next time you open fullscreen you start on **Chat** again (no lingering Notebooks selection).
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.6.3

## 2.6.2

### Patch Changes

- 5148408: Migrated to Jest 30 as required by @backstage/cli 0.36.0.
- Updated dependencies [5148408]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.6.2

## 2.6.1

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.6.1

## 2.6.0

### Patch Changes

- 9f5f22a: Fix new chat streams when switching threads and scope Stop to the streaming conversation (RHDHBUGS-3040).
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.6.0

## 2.5.1

### Patch Changes

- d621f93: Improved notebook upload modal and MessageBar UX.
- d621f93: Fixed overwrite flow to add duplicate files to the Add Document modal instead of uploading immediately. Reduced notebook delete toast timeout to 2 seconds.
- 5d17950: Retain Lightspeed chat and tool-call state when the chat UI remounts (for example when switching display mode between embedded and overlay), so the active thread and tool metadata are not dropped while messages are still streaming or before history refetches.
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.5.1

## 2.5.0

### Minor Changes

- d9df5b8: Add notebook chat with streaming support, document management, and UI improvements.
  - Backend: add SSE transform to normalize Responses API format to legacy streaming format so notebook chat streams token-by-token like the chat tab.
  - Frontend: add notebook chat view with conversation messages, document sidebar with per-document delete, and topic summary display.
  - Fix stale document list when re-opening a notebook by setting query staleTime to 0.
  - Hide model selector on the Notebooks tab while keeping the settings ellipsis menu visible.

- 8b0cb12: Add dedicated route for individual notebook view (/lightspeed/notebooks/:notebookId).

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.5.0

## 2.4.0

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.4.0

## 2.3.0

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.3.0

## 2.2.1

### Patch Changes

- 0c0e14e: Add an empty state for unconfigured LLM.
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.2.1

## 2.2.0

### Minor Changes

- 82a9ee8: Add notebook creation and document upload flow with file type validation, overwrite confirmation, collapsible document sidebar, file type icons, i18n support, and unit tests.

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.2.0

## 2.1.0

### Minor Changes

- cc98168: Migrated AI Notebooks from direct Llama Stack server to Lightspeed-Core integration

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.1.0

## 2.0.0

### Minor Changes

- 6ae51d4: migrated plugin to nfs
- f20f9f3: Add AI notebooks UI, hooks, and backend support for listing/renaming/deleting sessions.
- 0277bd0: Added the MCP servers selector/settings feature in Lightspeed with backend
  integration for listing servers, per-user token updates, and validation.

  In the settings panel, users can review server status, enable or disable
  eligible servers, configure personal tokens, and get inline token validation
  feedback. Token validation now runs automatically after typing stops and shows
  success (`Connection successful`) or error (`Authorization failed. Try again.`)
  before save.

- 01241c2: Backstage version bump to v1.49.2
  moved existing app to app-legacy
  app now runs the NFS model

### Patch Changes

- 5d4f070: update how tool call info is retrived
- afd7a1e: Update translations for Lightspeed.
- c45aa19: Add stop button to interrupt a streaming conversation
- c0f9d6a: fixes lightspeed overlay (remove horizontal scrollbar, and adds vertical scrollbar for newly created chats)
- 8f2c7f2: fix the overlay mode opening underneath the ApplicationDrawer
- a8b3dd9: Fixed "new chat" cta behavior
  Added vertical scroll when too many models are available
  Removed model grouping/categories in the model selector dropdown
- 7ce8caa: Added a missing permission screen for the Notebooks tab. When a user lacks the `lightspeed.notebooks.use` permission, the Notebooks tab now displays a "Missing permission" message with a "Go back" button instead of the notebook list.
- Updated dependencies [024d5a8]
- Updated dependencies [7db4bed]
- Updated dependencies [01241c2]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.0.0

## 1.4.0

### Patch Changes

- f6d5102: Translation updated for German and Spanish
- 6106526: Moved the `CustomDrawer` component from `packages/app` to `plugins/lightspeed/dev` to resolve workspace accessibility issues during development.
- b6f1568: updated plugin readme
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@1.4.0

## 1.3.0

### Minor Changes

- 0a7c742: Backstage version bump to v1.47.3

### Patch Changes

- cc12a51: Updated dependency `@patternfly/react-core` to `6.4.1`.
- Updated dependencies [0a7c742]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@1.3.0

## 1.2.3

### Patch Changes

- da2e71d: some ux improvements and persisting the display mode preference
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@1.2.3

## 1.2.2

### Patch Changes

- 00a1d21: Added missing display mode translations (`settings.displayMode.*`) for Japanese (ja) and Italian (it) locales.
- aaac497: Updated dependency `prettier` to `3.8.1`.
- Updated dependencies [aaac497]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@1.2.2

## 1.2.1

### Patch Changes

- 9c17c36: Updated dependency `prettier` to `3.8.0`.
- b0f22e5: Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.12.0`.
  Updated dependency `monaco-editor` to `^0.55.0`.
- 98bb56f: Render new lines in deepThinking component
- Updated dependencies [9c17c36]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@1.2.1

## 1.2.0

### Minor Changes

- bb8ef80: Added chatbot display modes (overlay, docked, fullscreen) with the ability to switch between modes via settings dropdown.
- 275b45e: feat: add conversation sorting with persistence, persisting pinned chats and pinned chats toggle per-user

### Patch Changes

- 7f4be01: Fixed file attachments being lost when changing display mode (overlay, docked, window).
- c5606c3: Refactor ToolCallContent component to use PatternFly components.
- e16075b: show expandable card for deep thinking responses
- fa48491: Added tool call support to display AI tool execution results
- ea9109f: Fixes an issue where the Chat History Drawer was remaining collapsed when loading the Lightspeed page in fullscreen/embedded mode on desktop.
- 1d656f2: Added a dark logo for light themes
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@1.2.0

## 1.1.2

### Patch Changes

- f74564d: Added 'it' and 'ja' i18n support and updated 'fr' translation strings.
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@1.1.2

## 1.1.1

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-lightspeed-common@1.1.1

## 1.1.0

### Minor Changes

- 99f35d5: Backstage version bump to v1.45.2

### Patch Changes

- Updated dependencies [99f35d5]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@1.1.0

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
- b609890: update lightspeed model dropdown styles
- Updated dependencies [58e26ba]
- Updated dependencies [40b80fe]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@1.0.4

## 1.0.3

### Patch Changes

- 5a26e61: Rever PF upgrade to reduce the bundle size
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@1.0.3

## 1.0.2

### Patch Changes

- ad1528c: Add localStorage persistence for last selected model

  The Lightspeed plugin now remembers the user's last selected model across page refreshes, automatically restoring it when available.

- f686a9a: updated legal text
- be83b61: Upgrade patternfly chatbot

  Monaco editor is used from npm package instead of cdn allowing us to remove custom csp rules

- c5fa204: Updated dependency `@types/express` to `4.17.25`.
  Updated dependency `msw` to `2.11.6`.
  Updated dependency `@patternfly/chatbot` to `6.4.1`.
  Updated dependency `@patternfly/react-core` to `6.4.0`.
- 71bb80d: fix streaming response in lightspeed UI
- d8bb650: Remove unsupported file type from lightspeed
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@1.0.2

## 1.0.1

### Patch Changes

- 7ba5eb5: use only llm models in the model dropdown

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

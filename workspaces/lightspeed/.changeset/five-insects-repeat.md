---
'@red-hat-developer-hub/backstage-plugin-lightspeed-common': patch
'@red-hat-developer-hub/backstage-plugin-lightspeed': patch
---

'@red-hat-developer-hub/backstage-plugin-lightspeed' :

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

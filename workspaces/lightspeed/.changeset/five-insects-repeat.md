---
'@red-hat-developer-hub/backstage-plugin-lightspeed-common': patch
'@red-hat-developer-hub/backstage-plugin-lightspeed': patch
---

'@red-hat-developer-hub/backstage-plugin-lightspeed' :

- Added missing translations for untranslated labels across the Lightspeed chat UI.
- Added lightspeed settings kebab menu
- Added a new “Favorites” section. The section is conditionally visible only when chat favorites are enabled in Lightspeed settings. It shows an empty state when no chats are marked as favorites.
- Added Kebab menu actions to each chat item with actions: Rename, Add to favorites, Remove from favorites
- Implemented logic to move chats between Favorites and Recent sections based on the selected action (“Add to favorites” / “Remove from favorites”).
- Updated search behavior to show results under both Favorites and Recent groups (when enabled), including appropriate empty search messaging.
- The Rename action opens a dialog with an editable text field and confirm/cancel actions.
- Replaced the patternfly components with MUI to match the Figma designs [Design 1](https://www.figma.com/design/urwU8VqRvHfbxMqxeVknrv/RHDH-Lightspeed---AI-Assistant?node-id=1523-1670&t=CqnUYsxar0PtjAjZ-0)
  [Design 2](https://www.figma.com/design/urwU8VqRvHfbxMqxeVknrv/RHDH-Lightspeed---AI-Assistant?node-id=2514-5415&t=PphIEOl5Yzmgv5tI-0)

'@red-hat-developer-hub/backstage-plugin-lightspeed-common':

Added the Update api client

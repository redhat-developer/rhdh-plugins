---
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant': minor
---

Add a Skills typeahead to the chat input using the PatternFly slash-command pattern. Typing `/` lists available skills from, filters by name or description, and supports keyboard and pointer selection while preserving message context. Show loading, empty, no-match, request-error, and permission-denied states without blocking chat, using the existing `intelligent-assistant.skills` permission.

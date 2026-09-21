---
'@red-hat-developer-hub/backstage-plugin-global-header': minor
---

Add a `/blueprints` package export that exposes only `GlobalHeaderMenuItemBlueprint`, so consumer plugins can register help/menu items without pulling the critical header UI bundle (and its `MarkdownContent` / syntax-highlighter transitive graph) into their Module Federation async chunks.

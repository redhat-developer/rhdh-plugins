---
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-widgets': minor
---

Add markdown rendering support to ActiveText widget

- Replace Typography component with MarkdownContent from @backstage/core-components
- Support both static markdown content and dynamic template variables in markdown
- Markdown features include headers, bold/italic text, lists, links, blockquotes, code blocks, and tables
- Remove deprecated ui:variant prop as markdown provides its own styling through syntax
- Update documentation to reflect markdown support and provide usage examples

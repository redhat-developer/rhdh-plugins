---
'@red-hat-developer-hub/backstage-plugin-x2a': minor
'@red-hat-developer-hub/backstage-plugin-x2a-backend': minor
'@red-hat-developer-hub/backstage-plugin-x2a-common': minor
---

Allow users who can write a project to edit the project migration plan and the module migration plans in the UI. A pencil next to the link to the document opens a Markdown editor with Cancel, Reload and Save actions, each confirmed in a dialog; Save creates a commit with a user-provided message. The backend gets new `migration-plan` read and save endpoints that access GitHub and GitLab through their REST APIs. GitLab OAuth applications must allow the `api` scope for this, because `write_repository` does not authorize REST API calls. Editing is not supported for Bitbucket yet, where the pencil is disabled.

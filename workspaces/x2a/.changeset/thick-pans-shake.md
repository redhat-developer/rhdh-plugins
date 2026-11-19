---
'@red-hat-developer-hub/backstage-plugin-x2a-scaffolder-module': minor
'@red-hat-developer-hub/backstage-plugin-x2a': minor
---

Add the `X2ARepoUrlPicker` scaffolder field and use it in the conversion project template, so
conversions work against SCM instances on custom URLs (self-hosted GitLab, GitHub Enterprise).

It renders the stock Backstage `RepoUrlPicker` and replaces two upstream behaviours that break
on custom hosts:

- `allowedHosts` defaults to the GitHub and GitLab hosts configured under `integrations:` plus
  `bitbucket.org`, instead of requiring a hard-coded list in the template. An explicit
  `allowedHosts` in a template still takes precedence. Bitbucket Cloud is supported with
  workspace and project inputs.
- `requestUserCredentials` is still handled by the stock picker (so owner/repository
  autocomplete works), but inside a scope where `scmAuthApi` obtains the token from the
  provider-level Backstage auth APIs instead of the host-keyed default, which only knows
  github.com, gitlab.com, bitbucket.org and dev.azure.com and throws for anything else. The
  secret is cleared when the host changes. The option gains a `readOnly` flag for requesting a
  read-only scope where the provider has one; `additionalScopes` is not supported.

Azure, Gerrit, Gitea and Bitbucket Server hosts are deliberately not offered; x2a has no
provider implementation for them.

Deployments that register the plugin's scaffolder field extensions by configuration
(RHDH dynamic plugins) must add `X2ARepoUrlPickerExtension` to `scaffolderFieldExtensions`.
If the extension is missing, the template's repository fields silently degrade to plain text
inputs.

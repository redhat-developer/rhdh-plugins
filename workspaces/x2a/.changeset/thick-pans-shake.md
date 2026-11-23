---
'@red-hat-developer-hub/backstage-plugin-x2a-scaffolder-module': minor
'@red-hat-developer-hub/backstage-plugin-x2a': minor
'@red-hat-developer-hub/backstage-plugin-x2a-common': minor
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
  autocomplete works), but inside a scope where `scmAuthApi` delegates to the app's
  `scmAuthApi` behind the `x2a.scm.authHosts` host guard. RHDH 1.10 or later maps every
  `integrations:` host to the provider's auth API; other apps must register `ScmAuth` for
  their hosts. Scopes are those of the app's `scmAuthApi` (GitLab OAuth apps must allow
  `api`). The secret is cleared when the host changes. The option gains a `readOnly` flag
  (passed as `repoWrite`, honoured by GitLab and Bitbucket); `additionalScopes` is forwarded
  as in the stock picker.

**BREAKING:** SCM access tokens are now bound to one host per provider type. After upgrading,
set `x2a.scm.authHosts.github` / `x2a.scm.authHosts.gitlab` to the host each OAuth provider is
registered against (GitLab `audience`, GitHub `enterpriseInstanceUrl`; Bitbucket Cloud is always
`bitbucket.org`). There is no default, not even for github.com or gitlab.com: until the key is
set, running phases, bulk runs, the CSV bulk import and the repository picker refuse every host
of that type with an error naming the missing key.

Backstage auth providers are configured once per provider type, so the access token they issue
is valid for a single host only. A token is now only handed to the host in `x2a.scm.authHosts`,
in the picker and in every other place that obtains SCM tokens, instead of being sent to another
host of the same type. With credentials requested, the picker offers only that host and says
which configured hosts it left out and why. The value may be a bare host or a URL, so the GitLab
`audience` can be copied as is. Keep `x2a.scm.authHosts` in sync with the auth provider config;
it cannot be verified from the frontend.

Repository URLs (CSV rows, stored projects) must be plain `https://` URLs without credentials,
backslashes or whitespace; others are refused before any token is requested. `extractHost` and
the stricter `extractAuthHost` are now exported from the common package.
`normalizeRepoUrl` no longer rewrites a full URL that carries `owner`/`repo` query parameters.

Azure, Gerrit, Gitea and Bitbucket Server hosts are deliberately not offered; x2a has no
provider implementation for them.

Deployments that register the plugin's scaffolder field extensions by configuration
(RHDH dynamic plugins) must add `X2ARepoUrlPickerExtension` to `scaffolderFieldExtensions`.
If the extension is missing, the template's repository fields silently degrade to plain text
inputs.

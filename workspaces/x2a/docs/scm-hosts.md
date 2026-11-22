# SCM hosts and the X2ARepoUrlPicker field

X2A conversion projects are created from the `x2a-conversion-project-template`
scaffolder template. In manual mode the template asks for a source and a target
repository with the `X2ARepoUrlPicker` custom scaffolder field.

## Why not the stock RepoUrlPicker

Two upstream behaviours make the stock `RepoUrlPicker` unusable for SCM
instances on custom URLs.

**The host dropdown is an allowlist, not an optional restriction.** Backstage's
`RepoUrlPicker` filters its dropdown by `ui:options.allowedHosts`. When that
option is absent the picker asks the scaffolder API for the integrations
matching an _empty_ host list, and the dropdown ends up **empty** — so simply
omitting `allowedHosts` does not work. A template using the stock picker has to
hard-code its hosts, which every deployment on a self-hosted GitLab or GitHub
Enterprise would then have to edit.

**Credentials are resolved by host.** `requestUserCredentials` makes the stock
picker call `scmAuthApi.getCredentials({ url: 'https://<host>' })`. The default
`scmAuthApi` (`ScmAuth.createDefaultApiFactory()`) only knows `github.com`,
`gitlab.com`, `bitbucket.org` and `dev.azure.com`; for any other host it throws
`No auth provider available for '<url>'`. The stock picker makes that call
inside a debounce without a `catch`, so the rejection is silent: no error is
shown, the secret is never written, and the conversion fails much later with
`Source repository token is required`. (RHDH 1.10 or later registers an
`scmAuthApi` that knows the `integrations:` hosts; the stock picker's empty host
list remains a problem there.)

## What X2ARepoUrlPicker does

`X2ARepoUrlPicker` renders the stock `RepoUrlPicker` — same owner and
repository pickers — and fixes the host list and guards the credentials.

### Host list

When the template does not set `allowedHosts`, the field fills it in from the
app config:

- Every GitHub and GitLab host listed under `integrations.github` and
  `integrations.gitlab` is offered, in that order, followed by `bitbucket.org`.
  The `integrations:` section is required for self-hosted instances.
- `bitbucket.org` is **always** offered: Backstage injects it by default and
  the frontend cannot see whether Bitbucket Cloud is configured (its config is
  stripped from the frontend config). Set `allowedHosts` explicitly in the
  template to hide it. Likewise, github.com and gitlab.com are offered only
  when they are listed explicitly.
- Bitbucket Cloud works end to end: the picker asks for workspace, project and
  repository.
- Azure, Gerrit, Gitea and **Bitbucket Server** hosts are **not** offered. x2a
  has no provider implementation for them; its Bitbucket provider is
  Bitbucket Cloud only.
- When credentials are requested (`requestUserCredentials`), only the host each
  OAuth provider is registered against is offered, see
  [`x2a.scm.authHosts`](#configuring-a-custom-scm-host). A GitHub or GitLab host
  that is in `integrations:` but not in `x2a.scm.authHosts` does not appear; a
  note under the field lists the hosts left out and the key to set.
- An explicit `allowedHosts` in the template still wins, so a deployment that
  wants to expose only some of its integrations can still say so. The note
  about left-out hosts is not shown then. The token rule below still applies
  to those hosts.

### Credentials

`ui:options.requestUserCredentials` is forwarded to the stock picker, so
owner/repository autocomplete works. The stock picker runs inside a scoped
`ApiProvider` whose `scmAuthApi` delegates to the **app's** `scmAuthApi`, behind
a host guard. The app's `scmAuthApi` must know the host:

- RHDH 1.10 or later registers one through `appIntegrationsModule`
  (`@red-hat-developer-hub/backstage-plugin-app-integrations`), which maps every
  `integrations.<type>[]` host to the one per-type auth API. Keep the
  `app-integrations` plugin enabled: if it is disabled or `scmAuthApi` is
  replaced, custom hosts get the sign-in error and no token (fail closed).
- Other Backstage apps must register `ScmAuth.forX(api, { host })` for each
  host, or add that module. The dev app (`packages/app/src/App.tsx`) shows the
  mapping.
- An integration host written with an explicit default port (`host:443`) is
  not matched by the app's `scmAuthApi`; write it without the port.

Backstage auth providers are configured **per provider type, not per host**,
so their token is valid for one host only. The mapping above would still hand
that token to **every** host of the type. So a token is **only requested for
the host the OAuth provider is registered against**, as declared by
`x2a.scm.authHosts` (see below). The check lives in the shared token helper
(`useRepoAuthentication`), so it covers the picker and every other place that
obtains SCM tokens: running phases and bulk runs on a project, and the CSV bulk
import. For any other host the app's `scmAuthApi` is not called, no OAuth flow
is started and no token is stored. The picker shows a message without a Retry
button, since only a configuration change helps. When the key is not set, no
GitHub or GitLab host can be authenticated.

The secret is also cleared as soon as another host is selected, and a failed
token request leaves it empty, so the conversion fails with
`Source repository token is required` instead of using another host's token.

The token is stored in the scaffolder secret named by `secretsKey`, raw — the
`createProjectAction` adds the provider-specific git-over-HTTPS prefix
server-side.

A failed sign-in is shown under the picker with a Retry button.

Scopes are those of the app's `scmAuthApi`, not narrowed by x2a (the same as the
stock picker). For GitLab the OAuth application must therefore allow `api`, plus
`read_user read_api read_repository write_repository`. Backstage sessions
accumulate scopes, so phase runs in the same session get the wide token too.

| `requestUserCredentials` option | Meaning                                                               |
| ------------------------------- | --------------------------------------------------------------------- |
| `secretsKey`                    | Scaffolder secret the access token is written to. Required.           |
| `readOnly`                      | Ask for a read-only scope. Defaults to `false`. See the caveat below. |
| `additionalScopes`              | Extra scopes per provider, forwarded to the app's `scmAuthApi`.       |

`readOnly` is passed to the app's `scmAuthApi` as `additionalScope.repoWrite`,
which GitLab and Bitbucket honour. GitHub's `repo` scope has no read-only
counterpart, so GitHub always gets read/write.

## Configuring a custom SCM host

Add the instance to `integrations:`, configure the matching auth provider, and
declare the host the auth provider belongs to in `x2a.scm.authHosts`. Backstage
supports one auth provider instance per provider type, so a deployment can use
one GitLab instance, one GitHub instance and one Bitbucket Cloud instance at a
time.

```yaml
integrations:
  gitlab:
    - host: gitlab.example.com # hostname only, no scheme
      apiBaseUrl: https://gitlab.example.com/api/v4

auth:
  providers:
    gitlab:
      development:
        clientId: ${AUTH_GITLAB_CLIENT_ID}
        clientSecret: ${AUTH_GITLAB_CLIENT_SECRET}
        audience: https://gitlab.example.com

x2a:
  scm:
    authHosts:
      # Must be the host of the auth provider above: for GitLab its `audience`,
      # for GitHub Enterprise its `enterpriseInstanceUrl`.
      gitlab: gitlab.example.com
      # github: ghe.example.com
```

`x2a.scm.authHosts.<github|gitlab>` is a single host, compared
case-insensitively. It may also be written as a URL
(`https://gitlab.example.com`), so the GitLab `audience` can be copied as is;
only the host is used and a default port (`:443`) is dropped. Include the port
when the host has a non-default one (`gitlab.example.com:8443`). Bitbucket Cloud is always
`bitbucket.org` and needs no entry.

**There is no default.** Set both keys for the providers you use, including for
`github.com` and `gitlab.com`; an unset key means no host of that type can be
authenticated, and the error names the missing key. The frontend cannot read
the auth provider's `audience`, so **keeping `x2a.scm.authHosts` in sync with
the auth provider configuration is up to the operator**: a mismatch means the
OAuth token is issued for a different host than the one it is sent to.

No change to the scaffolder template is needed — the host appears in the picker
on the next page load.

## Using in a template

```yaml
properties:
  sourceRepoUrl:
    title: Conversion source repository
    type: string
    ui:field: X2ARepoUrlPicker
    ui:options:
      requestUserCredentials:
        secretsKey: SRC_USER_OAUTH_TOKEN
```

## Registering the extension

The template references the field by name. If the field extension is not
registered, RJSF falls back to the default widget for the property's type —
a plain text input — **without reporting an error**, so this is worth
double-checking after an upgrade.

In a standard Backstage app using the legacy frontend system:

```typescript
import { X2ARepoUrlPickerExtension } from '@red-hat-developer-hub/backstage-plugin-x2a';

// In the App component, alongside <ScaffolderPage>:
<ScaffolderFieldExtensions>
  <X2ARepoUrlPickerExtension />
</ScaffolderFieldExtensions>
```

In the new frontend system the field ships with the plugin and needs no
registration. For RHDH with dynamic plugins, add it to the plugin's
`scaffolderFieldExtensions` — alongside the plugin's other field extensions,
since this key replaces the whole list:

```yaml
dynamicPlugins:
  frontend:
    red-hat-developer-hub.backstage-plugin-x2a:
      scaffolderFieldExtensions:
        - importName: RepoAuthenticationExtension
        - importName: RulesAcceptanceExtension
        - importName: X2ARepoUrlPickerExtension
```

## Known limitations

- **The source repository token is read/write.** The conversion template does
  not set `readOnly: true` on the source repository, even though the source is
  only read. When `areTargetAndSourceRepoShared` is set, `createProjectAction`
  reuses the source token to write to the target repository, so a read-only
  scope would break shared-repo conversions. Narrowing this needs the two cases
  to be distinguished first.
- **One instance per provider type.** Because Backstage auth providers are
  configured per provider type, only one GitHub, one GitLab and one Bitbucket
  Cloud host can be authenticated at a time: the one named in
  `x2a.scm.authHosts`. Repositories on any other host of the same type cannot
  be used for conversions, even if they are listed in `integrations:`.
- **`x2a.scm.authHosts` is not verified against the auth provider.** The
  frontend cannot read the auth provider configuration, so the two have to be
  kept in sync by hand.
- **Validation does not wait for the token.** The field's validation is the
  stock `repoPickerValidation`, which checks the repository URL only. If the
  OAuth exchange fails, the wizard still lets the user continue; the error is
  shown under the picker and the conversion fails later with
  `Source repository token is required`.

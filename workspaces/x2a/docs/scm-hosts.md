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
`Source repository token is required`.

## What X2ARepoUrlPicker does

`X2ARepoUrlPicker` renders the stock `RepoUrlPicker` — same owner and
repository pickers — and fixes both problems around it.

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
- An explicit `allowedHosts` in the template still wins, so a deployment that
  wants to expose only some of its integrations can still say so.

### Credentials

`ui:options.requestUserCredentials` is forwarded to the stock picker, so
owner/repository autocomplete works. The stock picker runs inside a scoped
`ApiProvider` that replaces `scmAuthApi` with a shim, so the app-level
`scmAuthApi` is never consulted. The shim obtains the token from the
provider-level Backstage auth API
(`githubAuthApiRef` / `gitlabAuthApiRef` / `bitbucketAuthApiRef`), the same way
the CSV bulk import does. Those auth providers are configured **per provider
type, not per host**, so they work with any instance.

The secret is cleared as soon as another host is selected, and a failed token
request leaves it empty, so the conversion fails with
`Source repository token is required` instead of using another host's token.

The token is stored in the scaffolder secret named by `secretsKey`, raw — the
`createProjectAction` adds the provider-specific git-over-HTTPS prefix
server-side.

Progress is shown under the picker, with a Retry button if the OAuth exchange
fails.

| `requestUserCredentials` option | Meaning                                                               |
| ------------------------------- | --------------------------------------------------------------------- |
| `secretsKey`                    | Scaffolder secret the access token is written to. Required.           |
| `readOnly`                      | Ask for a read-only scope. Defaults to `false`. See the caveat below. |
| `additionalScopes`              | **Not supported.** Ignored by the field.                              |

`readOnly` is honoured by GitLab (`read_repository` vs `write_repository`) and
Bitbucket (`repository` vs `repository:write`). GitHub's `repo` scope has no
read-only counterpart, so GitHub always gets read/write.

## Configuring a custom SCM host

Add the instance to `integrations:` and configure the matching auth provider.
Backstage supports one auth provider instance per provider type, so a
deployment can use one GitLab instance, one GitHub instance and one Bitbucket
Cloud instance at a time.

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
        # Must point at the same instance as the integration above.
        audience: https://gitlab.example.com
```

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
  configured per provider type, the picker can offer several hosts of the same
  type but only the one matching the configured `audience` will authenticate.
  A token obtained for the configured `audience` is sent to whichever
  same-type host is picked, so list only hosts that match the auth provider
  (set `allowedHosts` in the template if needed).
  When more than one host of the selected type is offered and credentials are
  requested, the picker shows a notice below the field saying that the token
  comes from the single configured provider and not from the selected host.
- **Validation does not wait for the token.** The field's validation is the
  stock `repoPickerValidation`, which checks the repository URL only. If the
  OAuth exchange fails, the wizard still lets the user continue; the error is
  shown under the picker and the conversion fails later with
  `Source repository token is required`.

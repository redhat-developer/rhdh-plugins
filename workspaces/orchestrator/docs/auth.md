# Requesting Authentication in Workflow Input Schema

This guide explains how to declare authentication requirements in a SonataFlow workflow input schema for the orchestrator plugin. It enables workflows to access external APIs on behalf of the user by forwarding authentication tokens from the user’s active Backstage session to SonataFlow.

## Key Concept

To request tokens, you define a **virtual field** in the workflow's input schema that triggers Backstage's authentication system. Once tokens are obtained, Backstage forwards them to the SonataFlow `execute` API as HTTP headers. These headers must match the configuration defined in the workflow's OpenAPI specification. The orchestrator plugin supports three built-in providers: github, gitlab and microsoft. Additionally, it supports custom authentication providers - for these, you must specify a `customProviderApiId` that corresponds to the Backstage ApiRef id of the custom provider plugin.

## Authentication Headers and SonataFlow Configuration

Backstage forwards authentication tokens to SonataFlow as HTTP headers. The header name follows the pattern `X-Authorization-<Provider>`. The matching between the provider specified in the workflow schema and the header is case insensitive.

### Provider Headers

| Provider   | Header                       | Type     |
| ---------- | ---------------------------- | -------- |
| gitHub     | `X-Authorization-Github`     | Built-in |
| gitLab     | `X-Authorization-Gitlab`     | Built-in |
| microsoft  | `X-Authorization-Microsoft`  | Built-in |
| github-two | `X-Authorization-Github-two` | Custom   |

### SonataFlow Configuration

Configure your `application.properties` to accept provider headers:

```properties
# Built-in provider example
quarkus.openapi-generator.github_yaml.auth.BearerToken.token-propagation=true
quarkus.openapi-generator.github_yaml.auth.BearerToken.header-name=X-Authorization-Github

# Custom provider example (github-two from [custom-authentication-provider-module](../plugins/custom-authentication-provider-module/) plugin)
quarkus.openapi-generator.githubtwo_yaml.auth.BearerToken.token-propagation=true
quarkus.openapi-generator.githubtwo_yaml.auth.BearerToken.header-name=X-Authorization-Github-Two
```

> 🔗 See the [SonataFlow token propagation documentation](https://www.rhdhorchestrator.io/main/docs/serverless-workflows/configuration/token-propagation/) for more details.

## Input Schema AuthRequester Field

### Field Behavior

- Does **not appear** in the form
- Is **not persisted** or included in the workflow input data
- Can have **any field name**
- Must **not be listed** in the schema's `required` array
- Only one `AuthRequester` field is needed, even for multiple providers. If multiple are included, only one will be applied.

### Required JSON Schema Properties

`type` – use the value `string` just for schema validity.

### UI Schema (`ui:widget` and `ui:props`)

| Property                        | Type               | Required             | Description                                                                                                                                                                                            |
| ------------------------------- | ------------------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ui:widget`                     | string             | Yes                  | Must be `"AuthRequester"`                                                                                                                                                                              |
| `ui:props.authTokenDescriptors` | array of objects   | Yes                  | List of token requirements                                                                                                                                                                             |
| — `provider`                    | string             | Yes                  | Built-in: `github`, `gitlab`, `microsoft` or custom provider identifier. Must match the part after X-Authorization- in the header defined in application properties. The matching is case insensitive. |
| — `customProviderApiId`         | string             | For custom providers | Backstage ApiRef id of the custom provider plugin (e.g., `my.custom.auth.github-two` from the [custom-authentication-provider-module](../plugins/custom-authentication-provider-module/) plugin)       |
| — `tokenType`                   | string             | Optional             | `"oauth"` or `"openId"` (default: `"oauth"`)                                                                                                                                                           |
| — `scope`                       | string or string[] | Optional             | Scope(s) to request, e.g., `"repo"` or `["repo", "read:user"]`                                                                                                                                         |

## Example

```json
{
  "authSetup": {
    "type": "string",
    "ui:widget": "AuthRequester",
    "ui:props": {
      "authTokenDescriptors": [
        {
          "provider": "github",
          "tokenType": "oauth",
          "scope": ["repo", "read:user"]
        },
        {
          "provider": "microsoft",
          "tokenType": "openId"
        },
        {
          "provider": "github-two",
          "customProviderApiId": "my.custom.auth.github-two",
          "tokenType": "oauth",
          "scope": ["read:user"]
        }
      ]
    }
  }
}
```

This example uses the `github-two` custom provider from the [`custom-authentication-provider-module`](../plugins/custom-authentication-provider-module/) plugin included in this repository. The plugin demonstrates how to create a custom authentication provider that extends the built-in GitHub authentication.

In these examples, the form will trigger the login popup for the specified providers, using the given scopes. If the user is already logged in with the specified scopes, the popup will not appear, and the tokens from earlier login will be propagated.

## `tokenType` details

The `tokenType` field defines which type of token Backstage should return:

| `tokenType` | Description                                                                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"oauth"`   | Retrieves an **OAuth access token** — Uses Backstage [getAccessToken](https://backstage.io/docs/reference/core-app-api.oauth2.getaccesstoken/).                                       |
| `"openId"`  | Retrieves an **ID token** (OpenID Connect) — used mainly for identity verification. Uses Backstage [getIdToken](https://backstage.io/docs/reference/core-app-api.oauth2.getidtoken/). |

> ⚠️ GitHub's Backstage OAuth provider does **not** support `openId` tokens.

## Scopes details

When specifying the `scope` field, refer to the official documentation for available scopes and their meanings:

### GitHub

GitHub scopes control access to repositories, user data, and other GitHub features.

- [GitHub OAuth scopes](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps)

**Examples:**

- "repo" – Full control of private and public repositories
- "read:user" – Read profile info
- "workflow" – Access GitHub Actions

---

### GitLab

GitLab scopes are used in OAuth and determine what actions the token allows.

- [GitLab OAuth 2 scopes](https://docs.gitlab.com/integration/oauth_provider/#view-all-authorized-applications)

**Examples:**

- "read_user" – Read user profile
- "api" – Full API access
- "write_repository" – Push access

---

### Microsoft

Microsoft tokens usually access Microsoft Graph, covering users, calendar, mail, Teams, and more.

- [Microsoft Graph permissions reference](https://learn.microsoft.com/en-us/graph/permissions-reference)

**Examples:**

- "User.Read" – Read user profile
- "Mail.Read" – Read email
- "Calendars.Read" – Read calendar events

## ⚙️ Required Backstage Auth Configuration

To use this feature, the relevant authentication providers must be properly configured in your Backstage app. This ensures the necessary tokens can be obtained when the workflow requests them. Each provider must be declared under the `auth.providers` section in `app-config.yaml`.

- [Backstage GitHub Auth Provider](https://backstage.io/docs/auth/github/provider)
- [Backstage GitLab Auth Provider](https://backstage.io/docs/auth/gitlab/provider)
- [Backstage Microsoft Auth Provider](https://backstage.io/docs/auth/microsoft/provider)

### Backstage Token Header

In addition to provider-specific tokens, The orchestrator plugin will always include the user’s session token in the `X-Authorization-Backstage` header when invoking SonataFlow workflow execution. This token represents the currently authenticated Backstage user and can be used to call backstage plugin APIs from a workflow.
To use it, include it in your `application.properties`:

```properties
# Backstage session token
quarkus.openapi-generator.backstagecatalog_yaml.auth.BearerToken.token-propagation=true
quarkus.openapi-generator.backstagecatalog_yaml.auth.BearerToken.header-name=X-Authorization-Backstage
```

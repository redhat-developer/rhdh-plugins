# Requesting Authentication in Workflow Input Schema

This guide explains how to declare authentication requirements in a SonataFlow workflow input schema for the orchestrator plugin. It enables workflows to access external APIs on behalf of the user by forwarding authentication tokens from the user’s active Backstage session to SonataFlow.

## Key Concept

To request tokens, you define a **virtual field** in the workflow’s input schema that triggers Backstage’s authentication system. Once tokens are obtained, Backstage forwards them to the SonataFlow `execute` API as HTTP headers. These headers must match the configuration defined in the workflow’s OpenAPI specification.

## Workflow Header Configuration

These are the headers Backstage will send:

| Provider  | Header                      |
| --------- | --------------------------- |
| GitHub    | `X-Github-Authorization`    |
| GitLab    | `X-Gitlab-Authorization`    |
| Microsoft | `X-Microsoft-Authorization` |

### Example `application.properties` Configuration

```
quarkus.openapi-generator.github_yaml.auth.BearerToken.token-propagation=true
quarkus.openapi-generator.github_yaml.auth.BearerToken.header-name=X-Github-Authorization
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

| Property                        | Type               | Required | Description                                                    |
| ------------------------------- | ------------------ | -------- | -------------------------------------------------------------- |
| `ui:widget`                     | string             | Yes      | Must be `"AuthRequester"`                                      |
| `ui:props.authTokenDescriptors` | array of objects   | Yes      | List of token requirements                                     |
| — `provider`                    | string             | Yes      | One of `github`, `gitlab`, `microsoft`                         |
| — `tokenType`                   | string             | Yes      | `"oauth"` or `"openId"`                                        |
| — `scope`                       | string or string[] | Optional | Scope(s) to request, e.g., `"repo"` or `["repo", "read:user"]` |

## Example

```
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
        }
      ]
    }
  }
}
```

In this example, the form will trigger the login popup for GitHub and Microsoft, using the specified scopes where given. If the user is already logged in with the specified scopes, the popup will not appear, and the tokens from earlier login will be propagated.

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

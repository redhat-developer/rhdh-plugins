# Requesting Authentication in Workflow Input Schema

This guide explains how to declare authentication requirements in a SonataFlow workflow input schema. This is necessary when a workflow interacts with external APIs that require user authorization — such as GitHub, GitLab, or Microsoft Graph.

Common use cases include:

- Creating a GitHub pull request
- Accessing private GitLab repositories
- Calling Microsoft Graph APIs on behalf of the user

## Key Concept

To request tokens, you define a **virtual field** in the input schema that triggers Backstage’s authentication system. This field:

- Does **not appear** in the form
- Is **not persisted** or included in the workflow input data
- Can have **any field name**
- Uses a special widget to signal token requirements

## What Matters

Only the following properties control behavior:

- `"ui:widget": "AuthRequester"` — activates token acquisition
- `"ui:props.authTokenDescriptors"` — declares which tokens and scopes are needed

All other properties are either ignored or required solely for schema validity.

## Example Schema

```json
{
  "anyFieldName": {
    "type": "string",
    "ui:widget": "AuthRequester",
    "ui:props": {
      "authTokenDescriptors": [
        {
          "provider": "github",
          "tokenType": "oauth",
          "scope": "repo"
        }
      ]
    }
  }
}
```

### ✅ Field name: can be anything

### ✅ `type`: required only for schema validation

### ✅ `ui:widget`: must be `"AuthRequester"`

### ✅ `ui:props.authTokenDescriptors`: required

## Field Definition Reference

### Required JSON Schema Properties

| Property | Type   | Required | Description                          |
| -------- | ------ | -------- | ------------------------------------ |
| `type`   | string | Yes      | Must be included for schema validity |

### UI Schema (`ui:widget` and `ui:props`)

| Property                        | Type               | Required | Description                                                           |
| ------------------------------- | ------------------ | -------- | --------------------------------------------------------------------- |
| `ui:widget`                     | string             | Yes      | Must be `"AuthRequester"`                                             |
| `ui:props.authTokenDescriptors` | array of objects   | Yes      | List of token requirements                                            |
| — `provider`                    | string             | Yes      | One of `github`, `gitlab`, `microsoft`                                |
| — `tokenType`                   | string             | Yes      | `"oauth"` or `"openId"`                                               |
| — `scope`                       | string or string[] | Optional | Scope or scopes to request, e.g., `"repo"` or `["repo", "read:user"]` |

## Multiple Providers Example

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
        }
      ]
    }
  }
}
```

In this example, the form will trigger login/token requests for GitHub and Microsoft, using the specified scopes where given.

## About `tokenType`

The `tokenType` field defines which type of token Backstage should return:

| `tokenType` | Description                                                                                                                                                                             |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"oauth"`   | Retrieves an **OAuth access token** — Uses backstage [`getAccessToken`](https://backstage.io/docs/reference/core-app-api.oauth2.getaccesstoken/).                                       |
| `"openId"`  | Retrieves an **ID token** (OpenID Connect) — used mainly for identity verification. Uses backstage [`getIdToken`](https://backstage.io/docs/reference/core-app-api.oauth2.getidtoken/). |

> ⚠️ Github backstage OAuth provider doesn't support openId tokens.

## About Scopes

When specifying the `scope` field, refer to the official documentation for available scopes and their meanings:

### GitHub

GitHub scopes control access to repositories, user data, and other GitHub features.

- [GitHub OAuth scopes](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps)

**Examples:**

- `"repo"` – Full control of private and public repositories
- `"read:user"` – Read profile info
- `"workflow"` – Access GitHub Actions

---

### GitLab

GitLab scopes are used in OAuth and determine what actions the token allows.

- [GitLab OAuth 2 scopes](https://docs.gitlab.com/integration/oauth_provider/#view-all-authorized-applications)

**Examples:**

- `"read_user"` – Read user profile
- `"api"` – Full API access
- `"write_repository"` – Push access

---

### Microsoft

Microsoft tokens usually access Microsoft Graph, covering users, calendar, mail, Teams, and more.

- [Microsoft Graph permissions reference](https://learn.microsoft.com/en-us/graph/permissions-reference)

**Examples:**

- `"User.Read"` – Read user profile
- `"Mail.Read"` – Read email
- `"Calendars.Read"` – Read calendar events

---

## Notes

- Only one `AuthRequester` field is needed per form, even for multiple providers. If multiple ones are included, only one of them will be applied.
- Never rely on the value of this field — it will always be `undefined`.

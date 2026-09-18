# `server.json` types

TypeScript shapes for MCP Registry **v1.8.1**
[`server.schema.json`](https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json)
live in [`src/types.ts`](../src/types.ts). Each table below mirrors one exported
type; headings link to the declaration in source.

## [`McpServerDocument`](../src/types.ts#L279)

Root `server.json` document (`ServerDetail`). Closed shape — only these fields
are allowed.

| Field         | Type                                           | Required | Description                                                     |
| ------------- | ---------------------------------------------- | -------- | --------------------------------------------------------------- |
| `$schema`     | `string`                                       | yes      | Absolute JSON Schema URI whose basename is `server.schema.json` |
| `name`        | `string`                                       | yes      | Reverse-DNS server name (`namespace/name`, exactly one `/`)     |
| `title`       | `string`                                       | no       | Optional human-readable display name                            |
| `description` | `string`                                       | yes      | Human-readable explanation of server capabilities               |
| `version`     | `string`                                       | yes      | Server version (semver preferred; ranges rejected)              |
| `websiteUrl`  | `string`                                       | no       | Homepage / docs / project website URL                           |
| `repository`  | [`McpServerRepository`](../src/types.ts#L176)  | no       | Source repository metadata                                      |
| `remotes`     | [`McpRegistryRemote`](../src/types.ts#L161)[]  | no       | Remote transports (`streamable-http` / `sse`)                   |
| `icons`       | [`McpRegistryIcon`](../src/types.ts#L208)[]    | no       | UI icons                                                        |
| `packages`    | [`McpRegistryPackage`](../src/types.ts#L230)[] | no       | Installable package entries                                     |
| `_meta`       | [`McpServerMeta`](../src/types.ts#L260)        | no       | Reverse-DNS extension metadata                                  |

## [`McpServerRepository`](../src/types.ts#L176)

Repository metadata for browsing and cloning source (`Repository`).

| Field       | Type     | Required | Description                                                  |
| ----------- | -------- | -------- | ------------------------------------------------------------ |
| `url`       | `string` | yes      | Repository URL (web browse and git clone)                    |
| `source`    | `string` | yes      | Hosting service id (`github`, `gitlab`, `bitbucket`, …)      |
| `id`        | `string` | no       | Hosting-service repo id (stable across renames)              |
| `subfolder` | `string` | no       | Clean relative path from repo root to the server (monorepos) |

## [`McpRegistryRemote`](../src/types.ts#L161)

Remote transport entry (`RemoteTransport`): `streamable-http` or `sse`, plus
optional URL template variables.

| Field       | Type                                                           | Required | Description                       |
| ----------- | -------------------------------------------------------------- | -------- | --------------------------------- |
| `type`      | `'streamable-http' \| 'sse'`                                   | yes      | Remote transport kind             |
| `url`       | `string`                                                       | yes      | Endpoint URL template             |
| `headers`   | [`McpKeyValueInput`](../src/types.ts#L62)[]                    | no       | Optional HTTP headers             |
| `variables` | `Record<string, McpInput>` ([`McpInput`](../src/types.ts#L26)) | no       | URL template variable definitions |

## [`McpRegistryIcon`](../src/types.ts#L208)

Icon resource for client UIs (`Icon`).

| Field      | Type                                                                            | Required | Description                      |
| ---------- | ------------------------------------------------------------------------------- | -------- | -------------------------------- |
| `src`      | `string`                                                                        | yes      | URI of the icon resource         |
| `mimeType` | `'image/png' \| 'image/jpeg' \| 'image/jpg' \| 'image/svg+xml' \| 'image/webp'` | no       | MIME type override               |
| `sizes`    | `string[]`                                                                      | no       | Size hints (e.g. `48x48`, `any`) |
| `theme`    | `'light' \| 'dark'`                                                             | no       | Theme the icon is designed for   |

## [`McpRegistryPackage`](../src/types.ts#L230)

Installable package entry (`Package`).

| Field                  | Type                                        | Required | Description                                      |
| ---------------------- | ------------------------------------------- | -------- | ------------------------------------------------ |
| `registryType`         | `string`                                    | yes      | Registry kind (`npm`, `pypi`, `cargo`, `oci`, …) |
| `identifier`           | `string`                                    | yes      | Package name or download URL                     |
| `transport`            | [`McpLocalTransport`](../src/types.ts#L147) | yes      | Local / package transport config                 |
| `version`              | `string`                                    | no       | Specific package version (no ranges)             |
| `registryBaseUrl`      | `string`                                    | no       | Base URL of the package registry                 |
| `runtimeHint`          | `string`                                    | no       | Runtime hint (`npx`, `uvx`, `docker`, …)         |
| `fileSha256`           | `string`                                    | no       | SHA-256 of the package file                      |
| `environmentVariables` | [`McpKeyValueInput`](../src/types.ts#L62)[] | no       | Environment variables for the package            |
| `packageArguments`     | [`McpArgument`](../src/types.ts#L101)[]     | no       | Arguments for the package binary                 |
| `runtimeArguments`     | [`McpArgument`](../src/types.ts#L101)[]     | no       | Arguments for the runtime command                |

## [`McpServerMeta`](../src/types.ts#L260)

Extension metadata (`ServerDetail._meta`) with reverse-DNS keys.

| Field                                                 | Type                      | Required | Description                                  |
| ----------------------------------------------------- | ------------------------- | -------- | -------------------------------------------- |
| `io.modelcontextprotocol.registry/publisher-provided` | `Record<string, unknown>` | no       | Publisher metadata for downstream registries |
| `[key: string]`                                       | `unknown`                 | no       | Additional reverse-DNS namespaced extensions |

## [`McpLocalTransport`](../src/types.ts#L147)

Local / package transport union (`LocalTransport`).

| Variant                                              | `type`              | Description                  |
| ---------------------------------------------------- | ------------------- | ---------------------------- |
| [`McpStdioTransport`](../src/types.ts#L109)          | `'stdio'`           | Stdio local transport        |
| [`McpStreamableHttpTransport`](../src/types.ts#L119) | `'streamable-http'` | Streamable HTTP transport    |
| [`McpSseTransport`](../src/types.ts#L133)            | `'sse'`             | Server-Sent Events transport |

### [`McpStdioTransport`](../src/types.ts#L109)

| Field  | Type      | Required | Description |
| ------ | --------- | -------- | ----------- |
| `type` | `'stdio'` | yes      | Literal     |

### [`McpStreamableHttpTransport`](../src/types.ts#L119)

| Field     | Type                                        | Required | Description           |
| --------- | ------------------------------------------- | -------- | --------------------- |
| `type`    | `'streamable-http'`                         | yes      | Literal               |
| `url`     | `string`                                    | yes      | URL template          |
| `headers` | [`McpKeyValueInput`](../src/types.ts#L62)[] | no       | Optional HTTP headers |

### [`McpSseTransport`](../src/types.ts#L133)

| Field     | Type                                        | Required | Description               |
| --------- | ------------------------------------------- | -------- | ------------------------- |
| `type`    | `'sse'`                                     | yes      | Literal                   |
| `url`     | `string`                                    | yes      | SSE endpoint URL template |
| `headers` | [`McpKeyValueInput`](../src/types.ts#L62)[] | no       | Optional HTTP headers     |

## [`McpInput`](../src/types.ts#L26)

Shared input leaf (`Input`) used by env vars, headers, variables, and arguments.

| Field         | Type                                              | Required | Description                                  |
| ------------- | ------------------------------------------------- | -------- | -------------------------------------------- |
| `choices`     | `string[]`                                        | no       | Allowed values the user must select from     |
| `default`     | `string`                                          | no       | Default value                                |
| `description` | `string`                                          | no       | Human-readable description for clients       |
| `format`      | `'string' \| 'number' \| 'boolean' \| 'filepath'` | no       | Input format hint                            |
| `isRequired`  | `boolean`                                         | no       | Whether the input is required                |
| `isSecret`    | `boolean`                                         | no       | Whether the input is a secret value          |
| `placeholder` | `string`                                          | no       | Placeholder shown during configuration       |
| `value`       | `string`                                          | no       | Fixed value (end users should not configure) |

## [`McpInputWithVariables`](../src/types.ts#L51)

Extends [`McpInput`](../src/types.ts#L26) with nested `{curly_brace}` variables
(`InputWithVariables`).

| Field       | Type                                                           | Required | Description                       |
| ----------- | -------------------------------------------------------------- | -------- | --------------------------------- |
| `variables` | `Record<string, McpInput>` ([`McpInput`](../src/types.ts#L26)) | no       | Nested variable input definitions |

## [`McpKeyValueInput`](../src/types.ts#L62)

Named key/value input for env vars or headers (`KeyValueInput`). Extends
[`McpInputWithVariables`](../src/types.ts#L51).

| Field  | Type     | Required | Description                         |
| ------ | -------- | -------- | ----------------------------------- |
| `name` | `string` | yes      | Header or environment variable name |

## [`McpArgument`](../src/types.ts#L101)

Package or runtime argument union (`Argument`).

| Variant                                        | `type`         | Description                      |
| ---------------------------------------------- | -------------- | -------------------------------- |
| [`McpPositionalArgument`](../src/types.ts#L73) | `'positional'` | Positional command-line argument |
| [`McpNamedArgument`](../src/types.ts#L87)      | `'named'`      | Named flag (`--flag={value}`)    |

### [`McpPositionalArgument`](../src/types.ts#L73)

Extends [`McpInputWithVariables`](../src/types.ts#L51).

| Field        | Type           | Required | Description                          |
| ------------ | -------------- | -------- | ------------------------------------ |
| `type`       | `'positional'` | yes      | Literal                              |
| `isRepeated` | `boolean`      | no       | Whether the argument may be repeated |
| `valueHint`  | `string`       | no       | Identifier / label for the argument  |

### [`McpNamedArgument`](../src/types.ts#L87)

Extends [`McpInputWithVariables`](../src/types.ts#L51).

| Field        | Type      | Required | Description                          |
| ------------ | --------- | -------- | ------------------------------------ |
| `type`       | `'named'` | yes      | Literal                              |
| `name`       | `string`  | yes      | Flag name, including leading dashes  |
| `isRepeated` | `boolean` | no       | Whether the argument may be repeated |

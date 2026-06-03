# MCP Tool Configuration

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Connect agents to live systems by registering MCP servers, configuring authentication, and setting tool approval policies.

## EXISTING Requirements

### Requirement: MCP Server Registration

Administrators register MCP servers and auto-discover available tools.

#### Scenario: Register MCP server

- **WHEN** the admin adds an MCP server in the admin panel
- **THEN** they provide: URL, transport (Streamable HTTP / SSE), and display name
- **AND** authentication is configured via one of: OAuth client credentials, K8s ServiceAccount token, static headers, or infrastructure mTLS (Kagenti)
- **AND** a connection test auto-discovers available tools

### Requirement: MCP Auth Chain (4 Levels)

A hierarchical authentication resolution for MCP tool connections.

#### Scenario: Auth chain resolution order

- **WHEN** an MCP tool call requires authentication
- **THEN** `McpAuthService` resolves credentials in order: auth references (per-tool) → per-server OAuth → ServiceAccount tokens → global fallback
- **AND** resolved tokens are cached with TTL derived from token expiry
- **AND** token deduplication prevents concurrent refresh storms

### Requirement: Tool Approval Policies

Per-server and per-tool approval requirements are configurable.

#### Scenario: Configure per-tool approval

- **WHEN** the admin configures an MCP server's tools
- **THEN** each tool can have `requireApproval: true` or `false`
- **AND** tools can be scoped to specific agents via per-agent allowed tool subsets

### Requirement: Kagenti Tool Management

Kagenti provides dedicated tool lifecycle management.

#### Scenario: Create tool via wizard

- **WHEN** the admin uses the `CreateToolWizard` (3 steps: basics, runtime, deploy)
- **THEN** a new tool is configured and deployed
- **AND** `ToolInvokeDialog` allows direct testing of the tool
- **AND** backend proxy mode supports air-gapped environments

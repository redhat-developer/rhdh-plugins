# Agent Creation Paths

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Four creation methods converge on a unified `ChatAgent` model. All paths produce agents visible in the gallery and available in chat.

## EXISTING Requirements

### Requirement: No-Code Agent Builder

Create agents visually without writing code.

#### Scenario: Llama Stack no-code agent creation

- **WHEN** the admin navigates to Admin Panel → Agents → "Create Agent"
- **THEN** an agent editor form shows: name, instructions, model, temperature, max tokens
- **AND** tool access is configured via MCP server/tool selection
- **AND** knowledge base is scoped via vector store ID selection
- **AND** handoffs are configured by selecting target agents
- **AND** on save, the agent is immediately available in chat

#### Scenario: Kagenti no-code agent creation

- **WHEN** the admin opens the `CreateAgentWizard`
- **THEN** a 3-step wizard guides: basics, deployment, runtime (plus optional build step)
- **AND** optionally, `AgentCreateIntentDialog` supports quick creation from natural language intent
- **AND** if a container build is needed, Shipwright is triggered
- **AND** the agent appears in the gallery on completion

### Requirement: Agent from Software Template

Bootstrap agent projects using Backstage Software Templates.

#### Scenario: Scaffolder creates agent project

- **WHEN** the user selects an agent template (LangGraph, CrewAI, Python A2A, etc.)
- **THEN** the scaffolder wizard collects: name, description, namespace, repo, framework options
- **AND** it generates: source code, Dockerfile, CI/CD pipeline, Kagenti manifest, MCP tool definitions
- **AND** CI/CD builds the container and registers the agent on merge

### Requirement: Agent from DevSpaces

Write agent code in a cloud development environment.

#### Scenario: DevSpaces agent development

- **WHEN** the admin launches a DevSpaces workspace from the Kagenti admin
- **THEN** a cloud IDE opens with agent SDK/ADK pre-installed
- **AND** the developer can test in a sandbox environment
- **AND** a Shipwright container build can be triggered from the admin panel
- **AND** the build pipeline panel shows status, logs, and history in real time
- **AND** on success, the agent is deployed as a K8s workload and discovered via A2A

### Requirement: Import Existing Agent

Bring existing agents (container images or source repos) into the platform.

#### Scenario: Import container image

- **WHEN** the user provides a container image reference
- **THEN** deployment configuration is collected: namespace, resource limits, env vars, MCP connections
- **AND** Kagenti deploys it as a K8s workload and discovers it via A2A
- **AND** the agent appears in the gallery with auto-detected capabilities

#### Scenario: Import source repository

- **WHEN** the user provides a source repo URL
- **THEN** build settings are configured and a Shipwright build is triggered
- **AND** on success, the agent is deployed and registered

### Requirement: Governance Registration

All agent creation paths register the agent for lifecycle governance.

#### Scenario: Agent registered for governance on creation

- **WHEN** an agent is created via any path (no-code, template, DevSpaces, import, or skills deployment)
- **THEN** the agent is automatically registered for governance (`governanceRegistered: true`)
- **AND** the agent enters the `Draft` lifecycle stage
- **AND** the `createdBy` field is set to the authenticated user's identity
- **AND** lifecycle actions (promote, withdraw, delete) are available per the agent's governance state

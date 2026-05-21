/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export interface DocSection {
  id: string;
  title: string;
  category: string;
  content: string;
}

export const DOC_CATEGORIES = [
  'Getting Started',
  'Agents',
  'Tools',
  'Platform',
  'Administration',
  'Reference',
];

export const DOCS: DocSection[] = [
  // =========================================================================
  // GETTING STARTED
  // =========================================================================
  {
    id: 'overview',
    title: 'Overview',
    category: 'Getting Started',
    content: `# {{appName}} Overview

{{appName}} is an enterprise AI agent management platform integrated into Red Hat Developer Hub. It provides a unified interface for deploying, orchestrating, and monitoring AI agents and MCP tools across your infrastructure.

## Key Concepts

### Agents
AI agents are autonomous programs that can understand natural language, use tools, and collaborate with other agents. {{appName}} supports deploying agents as container workloads on Kubernetes/OpenShift with full lifecycle management.

### MCP Tools
Model Context Protocol (MCP) tools extend agent capabilities — web search, database access, API calls, code execution, and more. Tools are deployed as separate services and connected to agents through the platform configuration.

### Orchestration
Multi-agent orchestration lets you define teams of specialized agents that can hand off conversations and delegate tasks to each other. A starting agent receives user requests and routes them to the right specialist.

### Namespaces
All agents and tools are deployed into Kubernetes namespaces. The namespace picker in the sidebar lets you scope your view to a specific namespace.

### Communication Protocols
Agents communicate using one of three protocols:
- **A2A** (Agent-to-Agent) — native agent communication protocol
- **MCP** (Model Context Protocol) — for tool-oriented agents
- **HTTP** — standard REST endpoints

## Platform Architecture

The platform consists of three layers:

1. **Frontend Plugin** — The UI you are using now, running inside Red Hat Developer Hub
2. **Backend Plugin** — Handles API routing, configuration management, and provider integration
3. **Kagenti Runtime** — The Kubernetes-native agent runtime that manages agent and tool workloads

## What You Can Do

| Area | Capabilities |
|------|-------------|
| **Agents** | Deploy from container images, build from source, develop with templates, configure orchestration |
| **Tools** | Deploy MCP tool servers, connect tools to agents, invoke and test tools |
| **Builds** | Trigger Shipwright container image builds, monitor build status |
| **Sandbox** | Create isolated testing sessions, manage agent lifecycle, browse files, monitor pods |
| **Platform Config** | Manage models, tools, MCP servers, RAG knowledge bases, safety guardrails, evaluation |
| **Observability** | Access distributed tracing, network monitoring, MCP inspector, and MCP proxy dashboards |
| **Administration** | Manage identity (Keycloak), namespaces, agent migration, API keys, LLM teams, integrations, DevSpaces, and sandbox triggers |
`,
  },

  {
    id: 'quick-start',
    title: 'Quick Start',
    category: 'Getting Started',
    content: `# Quick Start Guide

Get up and running with {{appName}} in three steps.

## Step 1: Navigate to Command Center

Click **Command Center** in the sidebar to enter the admin interface. You'll see the Home Dashboard with:

- **Stat Cards** — Overview of agents, tools, and namespace health
- **Quick Actions** — Shortcuts to create agents, tools, or launch the Guided Experience
- **Health Monitor** — Status of all deployed agents and tools

## Step 2: Create Your First Agent

1. Click **New Agent** (from Quick Actions or the Agents panel)
2. Choose how to get started:
   - **Develop** — Scaffold a new agent from a template or launch a DevSpace
   - **Import** — Deploy an existing agent from a container image or Git source
   - **Configure** — Set up multi-agent orchestration
3. Fill in the wizard fields (name, namespace, protocol, framework, deployment method)
4. Click **Create** to deploy (or **Start Build** for source-based deployments)

## Step 3: Chat With Your Agent

Once your agent shows "Ready" in the Health Monitor:
1. Click the agent row to view its details
2. Click the **Chat** button to start a conversation
3. Type a message and press Enter

## What's Next?

- **Add MCP Tools** — Go to the Tools panel to deploy tool servers that give your agents new capabilities
- **Set Up Orchestration** — Use Configure to create multi-agent routing with handoffs and delegation
- **Explore Platform Config** — Configure models, RAG knowledge bases, and safety guardrails
- **Run the Guided Tours** — Click the Guided Experience button on the Home dashboard for interactive walkthroughs
`,
  },

  // =========================================================================
  // AGENTS
  // =========================================================================
  {
    id: 'creating-agents',
    title: 'Creating Agents',
    category: 'Agents',
    content: `# Creating Agents

{{appName}} provides four paths to get an agent running on your platform.

## Import: Container Image

Deploy a pre-built agent from any container registry.

1. Go to **Agents** → **New Agent** → **Import**
2. **Basics** — Enter agent name, select namespace, choose protocol (A2A, MCP, or HTTP), and select framework (LangGraph, CrewAI, Google ADK, LlamaIndex, Semantic Kernel, Autogen, or Custom)
3. **Deployment** — Select "Container Image" and provide:
   - Image URL (e.g., \`ghcr.io/org/my-agent:latest\`)
   - Image pull secret (if your registry requires authentication)
4. **Runtime** — Configure:
   - Workload type (Deployment, StatefulSet, or Job)
   - Environment variables (direct values, from Secret, or from ConfigMap)
   - Service ports (name, port, target port, protocol)
   - Security settings (HTTP routes, auth bridge, SPIRE identity)
5. Click **Create** to deploy

## Import: Source from Git

Build an agent from source code using Shipwright pipelines.

1. Go to **Agents** → **New Agent** → **Import**
2. **Basics** — Enter agent name, namespace, protocol, and framework
3. **Deployment** — Select "Source from Git" and provide:
   - Git repository URL
   - Branch and subdirectory (optional)
   - Registry URL and registry secret for the built image
   - Image tag (optional)
   - Start command (optional)
   - Build strategy, Dockerfile path, and build timeout
   - Build arguments (key-value pairs, optional)
4. **Runtime** — Configure workload type, env vars, ports, and security
5. Click **Start Build** to trigger the Shipwright pipeline

The build progress appears in the Build Pipelines panel. Your agent is deployed automatically when the build completes.

## Develop: From Template

Scaffold a new agent project using a pre-configured software template.

1. Go to **Agents** → **New Agent** → **Develop** → **From Template**
2. Browse available templates (e.g., LangGraph agent, A2A agent)
3. Select a template and follow the scaffolding wizard
4. After development, return to Import to deploy from image or source

## Develop: Agent DevSpace

Launch a cloud IDE with your agent repo pre-configured.

1. Go to **Agents** → **New Agent** → **Develop** → **Agent DevSpace**
2. Provide the Git repository URL and select a namespace
3. Configure resource limits (memory, CPU)
4. Click **Create** to launch the DevSpace
5. Use the cloud IDE terminal to build and push your container image
6. Return to Import to deploy from the built image
`,
  },

  {
    id: 'agent-registry',
    title: 'Agent Registry & Lifecycle',
    category: 'Agents',
    content: `# Agent Registry & Lifecycle

The Agent Registry is the central staging area where administrators manage the full agent lifecycle — from initial discovery through enterprise registration to production deployment. Every agent, regardless of source (Kagenti, orchestration, or external), appears in the registry.

## Agent Lifecycle

Agents follow a three-stage promotion pipeline:

### 1. Draft
Agents start as **Draft** when first discovered. Draft agents are visible only to administrators in the registry. They have not been reviewed or vetted.

### 2. Registered
When an admin promotes a draft agent, it becomes **Registered** — a vetted enterprise asset. Registered agents have been reviewed but are not yet available to end users. This stage is for quality assurance and governance review.

### 3. Deployed
When a registered agent is promoted to **Deployed**, it goes live in the end-user catalog. Users can discover and chat with deployed agents. Each deployment increments the agent's version number.

## Core Concepts

### Promotion Pipeline
The registry header shows a visual pipeline of all three lifecycle stages with counts. Click any stage to filter the list. Promoting an agent requires confirmation — no accidental deployments.

### Versioning
Each promotion increments the agent's version number. The registry tracks who promoted the agent and when, providing an audit trail.

### Featured Agents
Deployed agents can be marked as **featured** to appear prominently on the chat welcome screen. Up to 4 agents can be featured simultaneously.

### Dev & Ops Views
Expanding an agent row shows two information sections:
- **Development** — source, framework, protocols, namespace, creation date
- **Operations** — runtime status, lifecycle stage, version, promotion history

## Agent Sources

| Source | Description | Status |
|--------|-------------|--------|
| **Kagenti** | Container workloads deployed on OpenShift | Runtime status (Ready, Pending, Error) |
| **Orchestration** | Multi-agent configurations from the Configure panel | Config-based (always "config") |

## Using the Registry

### Promoting an Agent
1. Navigate to **Agent Registry** under Agent Ops in the sidebar
2. Find the agent in the list (use search or filters)
3. Click **Register** to promote from Draft → Registered
4. Click **Deploy** to promote from Registered → Deployed
5. Confirm the promotion in the dialog

### Withdrawing an Agent
Click the back arrow on any agent to withdraw it to the previous lifecycle stage. Withdrawing a deployed agent removes it from the end-user catalog immediately.

### Configuring Display
Expand any agent row to customize how it appears to end users:
- **Display Name** — override the agent's technical name
- **Description** — custom description for the catalog
- **Avatar URL** — custom avatar image
- **Accent Color** — hex color for the agent's avatar
- **Greeting Message** — first message when a user starts a conversation
- **Conversation Starters** — suggested prompts shown on the welcome screen

### Bulk Operations
1. Select multiple agents using checkboxes
2. Use **Deploy All** or **Withdraw All** in the toolbar
3. All selected agents are updated simultaneously

### Quick Promote from Agent Detail
When viewing an agent's detail page in the Agents panel, use the **Deploy to Catalog** / **Withdraw** button in the header.
`,
  },

  {
    id: 'agent-orchestration',
    title: 'Agent Orchestration',
    category: 'Agents',
    content: `# Agent Orchestration

Multi-agent orchestration lets you create teams of specialized agents that collaborate to handle complex workflows.

## Accessing Orchestration

Go to **Agents** → **New Agent** → **Configure** to open the orchestration panel.

## The Orchestration Panel

### Toolbar
- **Starting Agent** — Which agent receives incoming requests first
- **Max Turns** — Maximum routing turns before the system stops (1–50, prevents infinite loops)
- **New Agent** — Add a new orchestrated agent
- **Save** — Persist the configuration

### Agent List
The left panel shows all orchestrated agents with:
- Agent name and key identifier
- Connection counts (inbound and outbound)
- Default/starting agent indicator (star icon)

### Agent Identity
Each agent has:
- **Display Name** — Human-readable name shown in the UI
- **Key** — Unique machine identifier (DNS-safe)
- **Handoff Description** — Critical text that other agents read when deciding whether to route to this agent

## Configuration Tabs

### Capabilities
- **Model Override** — Assign a specific model to this agent (or use the global default)
- **MCP Servers** — Connect MCP tool servers for this agent to use
- **Built-in Tools**:
  - **Knowledge Base** — Enable RAG for document search (with optional vector store selection)
  - **Web Search** — Allow the agent to search the web
  - **Code Interpreter** — Let the agent execute code

### Connections
- **Can Transfer To** (Handoffs) — Select agents this one can transfer the conversation to. The target agent takes full control; this agent stops responding.
- **Can Delegate To** (Delegation) — Select agents to run as background sub-tasks. This agent stays in control and receives results back.
- **Agent Topology** — Visual map of all routing paths between agents

### Advanced
- **Tool Choice** — How the model decides to use tools (auto, required, none)
- **Reasoning** — Effort level for chain-of-thought reasoning (low, medium, high)
- **Temperature** — Controls randomness in responses (0 = deterministic, 2 = creative)
- **Max Output Tokens** — Limit response length
- **Max Tool Calls** — Limit the number of tool invocations per turn
- **Guardrails** — Safety shield IDs to apply to this agent
- **Reset Tool Choice After Use** — Revert to "auto" after each tool call
- **Summarize History on Handoff** — Compress conversation history when transferring

### Instructions
- **Write** — Manually author the agent's system prompt
- **Generate** — Provide a description and let AI auto-generate instructions based on the agent's capabilities, connections, and tools
`,
  },

  {
    id: 'agent-lifecycle',
    title: 'Agent Lifecycle',
    category: 'Agents',
    content: `# Agent Lifecycle

## Monitoring Agent Status

The **Home Dashboard** Health Monitor and the **Agents** panel show the status of all deployed agents:

| Status | Meaning |
|--------|---------|
| **Ready** | Agent is deployed and accepting requests |
| **Pending** | Agent is being deployed or waiting for resources |
| **Building** | A Shipwright build is in progress |
| **Error** | Deployment failed — check agent details for more information |

## Agent Detail View

Click any agent in the Agents panel to see its detail view with four tabs:

### Details
- Agent name, namespace, description
- Workload type and replica status
- Creation timestamp and UID

### Agent Card
- A2A agent card information (name, description, capabilities, skills)
- Protocol and framework metadata

### Status
- Current pod/replica status
- Shipwright build status (if applicable)
- Build triggers and rebuild options

### Resource
- Raw Kubernetes resource YAML
- Copy-to-clipboard for debugging

## Rebuilding an Agent

If your agent was deployed from source, you can trigger a rebuild:
1. Open the agent detail view
2. Click **Rebuild** in the top-right
3. Monitor progress in the Build Pipelines panel

## Deleting an Agent

1. Open the Agents panel
2. Locate the agent in the table
3. Click the delete action (trash icon)
4. Confirm the deletion

## Chatting with an Agent

1. Open the agent detail view
2. Click the **Chat** button
3. The interface switches to chat mode with the selected agent
`,
  },

  // =========================================================================
  // TOOLS
  // =========================================================================
  {
    id: 'managing-tools',
    title: 'Managing MCP Tools',
    category: 'Tools',
    content: `# Managing MCP Tools

MCP (Model Context Protocol) tools extend your agents' capabilities. Tools run as separate services and are connected to agents through the platform configuration.

## Creating a Tool

1. Go to **Tools** → **New Tool**
2. Choose your path:
   - **Develop** — Scaffold from a template or launch a Tool DevSpace
   - **Deploy** — Bring an existing tool onto the platform

### Develop Path
- **From Template** — Scaffold a new MCP tool project from a pre-configured software template
- **Tool DevSpace** — Launch a cloud IDE workspace to develop your MCP tool with full tooling and runtime support

### Deploy Path

#### Basics
- **Tool Name** — Unique name for the tool (DNS-1123 label)
- **Namespace** — Target Kubernetes namespace
- **Protocol** — MCP protocol variant
- **Description** — What this tool does (agents read this to decide when to use it)

#### Deployment Method
- **Container Image** — Deploy from a pre-built image
- **Source from Git** — Build from a Git repository using Shipwright

#### Runtime Configuration
- **Workload Type** — Deployment, StatefulSet, or Job
- **Environment Variables** — Key-value pairs for tool configuration
- **Ports** — Service ports the tool exposes
- **Security** — HTTP routes, auth bridge, SPIRE identity

## Connecting Tools to Agents

Tools deployed through {{appName}} are managed as Kubernetes workloads. To make external MCP servers available to orchestrated agents:
1. Go to **Platform Config** → **MCP Servers**
2. Register the external server's URL and connection type
3. In **Agent Orchestration**, enable the MCP server in the agent's Capabilities tab

## Tool Discovery

Use the **MCP Tool Discovery** feature to automatically detect available tools from an MCP server:
1. Open the tool detail drawer (click a tool row in the Tools panel)
2. Click **Connect** to establish a connection
3. Browse the list of discovered tools and their schemas
4. Click **Invoke** to test a tool with sample parameters

## Tool Health

The Home Dashboard's Health Monitor shows tool status alongside agents. Tools follow the same status model (Ready, Pending, Building, Error).
`,
  },

  // =========================================================================
  // PLATFORM
  // =========================================================================
  {
    id: 'platform-config',
    title: 'Platform Configuration',
    category: 'Platform',
    content: `# Platform Configuration

Platform Config manages the shared AI infrastructure used by all agents. Access it from the **Platform Config** sidebar item.

## Model

Set the default LLM model used by agents:
- Select from available models via the model dropdown
- Test model connectivity with the test button
- Agents can override the global model in their individual Capabilities tab

## Tools

Manage the built-in tool registry available to agents. This tab lists tools registered at the platform level and allows you to configure tool-level settings.

## MCP Servers

Register external MCP tool servers:
- **Add Server** — Provide server name, URL, and connection type (SSE or Streamable HTTP)
- **Test Connection** — Verify the server is reachable
- **Enable/Disable** — Toggle individual servers without removing them
- Servers registered here appear in the Capabilities tab of orchestrated agents

## RAG / Knowledge Base

Configure Retrieval-Augmented Generation:
- **Vector Stores** — Create and manage vector stores for document search
- **Document Ingestion** — Upload documents for agents to reference
- **Sync** — Trigger re-indexing of ingested documents
- Agents enable Knowledge Base access per-agent in their Capabilities tab

## Safety

Configure safety shields that filter agent inputs and outputs:
- Define guardrail IDs
- Agents reference these IDs in their Advanced settings tab
- Guardrails run as pre/post processing steps in the agent pipeline

## Evaluation

Monitor model evaluation metrics and configure evaluation pipelines for quality assurance.

> **Note**: Tab visibility depends on provider capabilities. Some tabs may be hidden if the active provider does not support a feature.
`,
  },

  {
    id: 'build-pipelines',
    title: 'Build Pipelines',
    category: 'Platform',
    content: `# Build Pipelines

Build Pipelines provides visibility into Shipwright container image builds for agents and tools.

## Viewing Builds

The Build Pipelines panel shows all builds across namespaces with:
- **Name** — Build or BuildRun name
- **Type** — Whether the build is for an Agent or a Tool
- **Workspace** — The namespace where the build runs
- **Strategy** — The Shipwright build strategy used
- **Git URL** — Source repository for the build
- **Status** — Succeeded, Failed, Running, Pending
- **Created** — When the build was triggered
- **Actions** — Trigger a rebuild

## Build Strategies

Shipwright supports multiple build strategies. Common examples include:
- **buildah** — Build images using Buildah
- **kaniko** — Build images using Kaniko
- **source-to-image** — OpenShift S2I builds
- Custom strategies registered in your cluster

The available strategies depend on the ClusterBuildStrategies installed on your cluster. View them in **Administration** → **Build Strategies**.

## Triggering Builds

Builds are triggered automatically when you:
1. Create an agent or tool with "Source from Git" deployment method
2. Click **Rebuild** from an agent or tool detail view

## Monitoring Build Progress

1. Navigate to **Build Pipelines** in the sidebar
2. Find your build in the list
3. Check the status column for current progress
4. Click a build row for detailed information

Build status also appears in the **Home Dashboard** under the "Recent Builds" tab.
`,
  },

  {
    id: 'sandbox-testing',
    title: 'Sandbox Testing',
    category: 'Platform',
    content: `# Sandbox Testing

The Sandbox provides isolated testing environments for agents before production deployment.

## Prerequisites

Select a **namespace** from the sidebar dropdown before accessing the Sandbox panel.

## Tabs

The Sandbox panel has six tabs:

### Sessions
Create and manage sandbox sessions:
- **Create Session** — Start a new sandbox session for an agent
- **Search & Filter** — Find sessions by name or status
- **Session Actions** — Rename, approve/deny, delete, or kill sessions
- **Token Usage** — View token consumption per session
- **Session Detail** — Click a session to view its sub-tabs:
  - **Detail** — Full session metadata (JSON)
  - **Chain** — Conversation routing chain
  - **History** — Complete conversation history

### Agent Lifecycle
Manage the lifecycle of agents within the sandbox:
- Deploy sandbox-specific agent instances
- Monitor agent readiness and health
- View agent pod information

### Pod Observability
Monitor pods running in the sandbox namespace:
- View pod status, resource usage, and events
- Inspect running containers

### File Browser
Browse the file system of sandbox agents:
- Navigate directory structures within agent containers
- View file contents for debugging

### Sidecars
Manage sidecar containers attached to sandbox agents:
- View sidecar status and logs
- Observe sidecar events via SSE streams

### Events & Tasks
Monitor events and background tasks in the sandbox:
- Track sandbox lifecycle events
- View scheduled and completed tasks
`,
  },

  {
    id: 'observability',
    title: 'Observability',
    category: 'Platform',
    content: `# Observability

The Observability panel provides links to external monitoring dashboards configured for your platform.

## Available Dashboards

Dashboards are organized into two categories:

### Observability
| Dashboard | Purpose |
|-----------|---------|
| **Traces** | Distributed tracing for agent requests and A2A calls (e.g., Jaeger) |
| **Network** | Network topology and service mesh visualization (e.g., Kiali) |

### Development
| Dashboard | Purpose |
|-----------|---------|
| **MCP Inspector** | Inspect and debug MCP tool connections |
| **MCP Proxy** | Manage MCP proxy routing and endpoints |

## Configuring Dashboard URLs

Dashboard URLs are loaded from the Kagenti platform configuration. Administrators can configure them through the \`app-config.yaml\` under \`augment.kagenti.dashboards\`.

Dashboard entries include:
- **Key** — Dashboard identifier (e.g., \`traces\`, \`network\`, \`mcpInspector\`, \`mcpProxy\`)
- **URL** — Full URL to the external dashboard

## Namespace Scoping

When a namespace is selected in the sidebar, dashboard links automatically append a \`?namespace=\` query parameter to pre-filter their views.
`,
  },

  // =========================================================================
  // ADMINISTRATION
  // =========================================================================
  {
    id: 'administration',
    title: 'Administration',
    category: 'Administration',
    content: `# Administration

The Administration panel provides access to platform management features. Availability depends on your feature flags and role.

## Identity Management

Access the Keycloak console for user, role, and authentication policy management. Requires the Keycloak console URL to be configured in the platform dashboard settings.

## Namespace Management

View all enabled Kubernetes namespaces where agents and tools can be deployed. The namespace picker in the sidebar scopes all views to the selected namespace.

## Agent Migration

Migrate agents from the legacy Agent CRD workload type to the Deployment workload type:
- View migratable agents with their current status
- Migrate agents individually or use **Migrate All**
- Check whether each agent already has a Deployment resource

## Build Strategies

View available ClusterBuildStrategies installed on your cluster. These strategies are used by Shipwright when building agent and tool container images from source.

## Dev Spaces

Configure Red Hat Dev Spaces for cloud-based agent development:
- **Dev Spaces API URL** — Endpoint for the Dev Spaces API
- **OpenShift Token** — Optional bearer token for Kubernetes API authentication (used if the cluster does not use Keycloak as an identity provider)

## LLM Models

View available LLM models from the Kagenti platform as raw JSON data.

## LLM Teams

Organize model access by team:
- View all configured LLM teams
- **Create Team** — Specify namespace and optional team name

## LLM API Keys

Manage API keys for agent model access:
- View all configured API keys (by namespace and agent)
- **Create Key** — Specify namespace and agent name
- Delete individual keys

## Integrations

Configure external service integrations:
- View all integrations (namespace, name, type)
- **Create** — Add a new integration with namespace, name, type, and config JSON
- **Test** — Verify connectivity to an integration
- **Delete** — Remove an integration

## Sandbox Trigger

Manually trigger a sandbox session for an agent:
- **Namespace** — Target namespace (required)
- **Agent Name** — Specific agent to target (optional)
- **Type** — Trigger type: webhook, cron, or alert
- **Message** — Trigger payload message
`,
  },

  {
    id: 'branding',
    title: 'Branding & Appearance',
    category: 'Administration',
    content: `# Branding & Appearance

Customize the look and feel of {{appName}} through the Branding panel.

## Appearance

### Identity
- **App Name** — The product name displayed throughout the UI (currently "{{appName}}")
- **Tagline** — Subtitle shown on the welcome screen
- **Input Placeholder** — Default text in the chat input field
- **Logo URL** — Custom logo image (must be https:// or http://)
- **Favicon URL** — Browser tab icon (must be https:// or http://)

### Colors
- **Primary Color** — Main accent color
- **Secondary Color** — Supporting color
- **Success Color** — Color for success states
- **Warning Color** — Color for warning states
- **Error Color** — Color for error states
- **Info Color** — Color for informational states

### Theme
- **Theme Preset** — Choose from built-in color themes that apply a coordinated set of colors

## Prompt Groups

Organize conversation starters into groups:
- Create and edit prompt groups
- Add prompts with titles and descriptions
- Reorder prompts within groups
- Prompts appear on the chat welcome screen

## Chat Experience

Configure the chat interface behavior and features. This tab is available when the Kagenti provider is active.

## Configuration Precedence

Branding follows the standard configuration precedence:
1. Code defaults (built into the plugin)
2. YAML configuration (\`augment.branding\` in \`app-config.yaml\`)
3. Admin UI overrides (saved to the database via this panel)

Admin UI values override YAML, which overrides defaults.
`,
  },

  {
    id: 'security',
    title: 'Security & Access',
    category: 'Administration',
    content: `# Security & Access

{{appName}} supports three security modes to control who can access the plugin and its features.

## Security Modes

| Mode | Description | Setup Required |
|------|-------------|----------------|
| **none** | No authentication required | Just set \`security.mode: 'none'\` |
| **plugin-only** | Keycloak + Backstage RBAC | Keycloak configuration + RBAC policies |
| **full** | Keycloak + RBAC + MCP OAuth | Full security stack (experimental) |

## Plugin Access Control

Access to {{appName}} is controlled by the \`augment.access\` Backstage permission:
- Configure in your RBAC policies who can access the plugin
- Users without the permission see a "Not authorized" message

## Admin Access

Admin features (Command Center, configuration changes, agent/tool management) require:
- \`augment.admin\` permission, OR
- Username listed in \`augment.security.adminUsers\` configuration

## Keycloak Setup

For \`plugin-only\` and \`full\` modes:
1. Configure a Keycloak realm with an OIDC client for Backstage
2. Set up user groups for access control
3. Configure Backstage to use Keycloak as the auth provider
4. Define RBAC policies for the \`augment.access\` and \`augment.admin\` permissions

## Configuration Example

\`\`\`yaml
augment:
  security:
    mode: 'plugin-only'
    adminUsers:
      - admin@example.com
      - platform-admin@example.com
\`\`\`
`,
  },

  // =========================================================================
  // REFERENCE
  // =========================================================================
  {
    id: 'config-reference',
    title: 'Configuration Reference',
    category: 'Reference',
    content: `# Configuration Reference

All configuration for {{appName}} lives under the \`augment\` key in \`app-config.yaml\`.

## Minimum Required Configuration

\`\`\`yaml
augment:
  llamaStack:
    baseUrl: 'https://your-llama-stack-server.com'
    model: 'meta-llama/Llama-3.3-70B-Instruct'
\`\`\`

## Configuration Precedence

\`\`\`
EffectiveConfig = YAML baseline + DB admin overrides
\`\`\`

1. **YAML** — Loaded at startup from \`app-config.yaml\`
2. **Database** — Admin UI saves override YAML per-key
3. **Cache** — Merged result cached for 5 seconds; invalidated on admin save
4. **Fallback** — If DB is unreachable, YAML-only mode with warning

### Special Merge Rules

| Key | Behavior |
|-----|----------|
| \`branding\` | Shallow merge — DB fields win, YAML-only fields survive |
| \`mcpServers\` | Smart merge — matching IDs override, new servers appended |
| \`agents\` | Full replacement — DB agents completely replace YAML agents |

## Key Configuration Sections

### Provider
\`\`\`yaml
augment:
  provider: 'kagenti'  # or 'llamastack'
\`\`\`

### Kagenti Runtime
\`\`\`yaml
augment:
  kagenti:
    baseUrl: 'https://kagenti-api.example.com'
    token: '\${KAGENTI_TOKEN}'
\`\`\`

### Branding
\`\`\`yaml
augment:
  branding:
    appName: 'My AI Platform'
    tagline: 'Your enterprise AI assistant'
    primaryColor: '#1e40af'
\`\`\`

### Security
\`\`\`yaml
augment:
  security:
    mode: 'plugin-only'  # 'none' | 'plugin-only' | 'full'
    adminUsers:
      - admin@example.com
\`\`\`

### MCP Servers
\`\`\`yaml
augment:
  mcpServers:
    - id: 'kubernetes'
      name: 'Kubernetes MCP'
      url: 'http://mcp-server:8080/sse'
      type: 'sse'
\`\`\`

### Agents (YAML-defined)
\`\`\`yaml
augment:
  agents:
    router:
      name: Router
      instructions: 'Route requests to specialist agents'
      handoffs:
        - specialist
    specialist:
      name: Specialist
      instructions: 'Handle domain-specific tasks'
      mcpServers:
        - kubernetes
\`\`\`

## YAML Changes Require Restart

The plugin does not watch for file changes. Any modification to \`app-config.yaml\` requires a backend restart to take effect.
`,
  },

  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    category: 'Reference',
    content: `# Troubleshooting

Common issues and solutions for {{appName}}.

## "Setup Needed" or "Failed to connect to backend"

**Cause**: The backend plugin is not reachable or not configured.

**Solutions**:
1. Verify \`augment.llamaStack.baseUrl\` and \`augment.llamaStack.model\` are set in \`app-config.yaml\`
2. Check that the backend plugin is installed and loaded (look for "Augment configuration validated successfully" in pod logs)
3. Test \`GET /api/augment/health\` — if it returns 404, the plugin never loaded
4. For Kagenti provider, verify \`augment.kagenti.baseUrl\` is reachable

## 400 Error Saving Agent Configuration

**Cause**: Validation failure in the agent payload.

**Common errors**:
| Error | Cause |
|-------|-------|
| "Agent must have a non-empty name" | Missing name field |
| "Agent must have non-empty instructions" | Missing instructions |
| "Handoff to X which does not exist" | Referenced agent not in the save payload |
| "agents must be a non-null object" | Wrong payload structure |

**Resolution**: Ensure every agent has at minimum a \`name\` and \`instructions\` field. All handoff and delegation targets must exist in the same save.

## Agent Stuck in "Pending"

**Possible causes**:
- Insufficient cluster resources (CPU/memory)
- Image pull errors (wrong URL or missing pull secret)
- Namespace quotas exceeded

**Diagnosis**:
1. Open the agent detail view → Status tab
2. Check replica status and pod events
3. Look at the Resource tab for the full Kubernetes spec

## Build Failed

**Diagnosis**:
1. Go to **Build Pipelines** panel
2. Find the failed build
3. Check the build status and error messages
4. Verify the Git repository URL, Dockerfile path, and registry URL

**Common causes**:
- Invalid Git repository URL
- Dockerfile not found at the specified path
- Registry authentication failure
- Build strategy not available in the cluster

## MCP Tool Connection Failed

**Solutions**:
1. Verify the MCP server URL is correct and reachable from the cluster
2. Check the connection type (SSE vs Streamable HTTP)
3. Use **Platform Config → MCP Servers → Test Connection** to diagnose
4. Check that the MCP server is running and healthy

## Dark Mode Text Invisible

If text appears invisible in dark mode, this is a known theming issue. Try:
1. Toggle between light and dark mode
2. Refresh the page
3. Report the specific panel/component where the issue occurs
`,
  },

  {
    id: 'api-reference',
    title: 'API Reference',
    category: 'Reference',
    content: `# API Reference

{{appName}} exposes a REST API under \`/api/augment\`. All endpoints require authentication unless noted.

## Health & Status

| Method | Path | Description |
|--------|------|-------------|
| GET | \`/health\` | Liveness check (503 if provider init failed) — no auth required |
| GET | \`/status\` | Provider status, MCP status, admin flag |
| GET | \`/branding\` | Merged branding configuration |

## Chat

| Method | Path | Description |
|--------|------|-------------|
| POST | \`/chat\` | Non-streaming chat response |
| POST | \`/chat/stream\` | Server-Sent Events streaming chat |
| POST | \`/chat/approve\` | Approve pending tool calls (rate-limited) |

## Sessions

| Method | Path | Description |
|--------|------|-------------|
| GET | \`/sessions\` | List chat sessions |
| POST | \`/sessions\` | Create a new session |
| GET | \`/sessions/:id\` | Get session details |
| DELETE | \`/sessions/:id\` | Delete a session |
| PATCH | \`/sessions/:id\` | Update session (rename) |
| GET | \`/sessions/:id/messages\` | Get session messages |
| GET | \`/sessions/:id/state\` | Get session state |
| POST | \`/feedback\` | Submit feedback for a message |

## Documents & RAG

| Method | Path | Description |
|--------|------|-------------|
| GET | \`/documents\` | List ingested documents |
| POST | \`/sync\` | Trigger document re-indexing |
| GET | \`/vector-stores\` | List vector stores |
| GET | \`/safety/status\` | Safety guardrail status |
| GET | \`/evaluation/status\` | Evaluation pipeline status |

## Admin Configuration

All admin endpoints require admin access.

| Method | Path | Description |
|--------|------|-------------|
| GET | \`/admin/effective-config\` | Merged YAML + DB configuration |
| GET | \`/admin/config\` | All config keys |
| GET | \`/admin/config/:key\` | Get a specific config key |
| PUT | \`/admin/config/:key\` | Set a config key (body: \`{ value: ... }\`) |
| DELETE | \`/admin/config/:key\` | Reset a key to YAML defaults |
| GET | \`/admin/providers\` | List available providers |
| GET | \`/admin/active-provider\` | Get active provider |
| PUT | \`/admin/active-provider\` | Switch active provider |
| GET | \`/admin/models\` | List available models |
| POST | \`/admin/test-model\` | Test model connectivity |
| POST | \`/admin/generate-system-prompt\` | AI-generate agent instructions |
| POST | \`/admin/mcp/test-connection\` | Test MCP server connectivity |

### Admin Documents & Vector Stores

| Method | Path | Description |
|--------|------|-------------|
| POST | \`/admin/documents\` | Upload a document |
| DELETE | \`/admin/documents/:id\` | Delete a document |
| GET | \`/admin/vector-stores\` | List vector stores |
| POST | \`/admin/vector-store/create\` | Create a vector store |
| GET | \`/admin/vector-store/status\` | Vector store status |
| POST | \`/admin/vector-stores/connect\` | Connect to a vector store |
| DELETE | \`/admin/vector-stores/:id\` | Delete a vector store |

### Admin Sessions

| Method | Path | Description |
|--------|------|-------------|
| GET | \`/admin/sessions\` | List all sessions (admin view) |
| GET | \`/admin/sessions/:id/messages\` | Get messages for any session |

## Dev Spaces

| Method | Path | Description |
|--------|------|-------------|
| POST | \`/devspaces/workspaces\` | Create a DevSpaces workspace (admin) |

## Kagenti Agents

Available when using the Kagenti provider.

| Method | Path | Description |
|--------|------|-------------|
| GET | \`/kagenti/agents\` | List agents (query: namespace, include=cards) |
| POST | \`/kagenti/agents\` | Create an agent (admin) |
| GET | \`/kagenti/agents/:ns/:name\` | Get agent details |
| DELETE | \`/kagenti/agents/:ns/:name\` | Delete an agent (admin) |
| GET | \`/kagenti/agents/:ns/:name/route-status\` | Agent route/endpoint status |
| GET | \`/kagenti/agents/:ns/:name/build-info\` | Build information |
| POST | \`/kagenti/agents/:ns/:name/buildrun\` | Trigger a build (admin) |
| POST | \`/kagenti/agents/:ns/:name/finalize-build\` | Finalize a build (admin) |
| POST | \`/kagenti/agents/:ns/:name/migrate\` | Migrate agent CRD (admin) |
| POST | \`/kagenti/agents/migration/migrate-all\` | Migrate all agents (admin) |
| GET | \`/kagenti/agents/migration/migratable\` | List migratable agents |
| GET | \`/kagenti/agents/build-strategies\` | List build strategies |
| GET | \`/kagenti/agents/shipwright-builds\` | List Shipwright builds |

## Kagenti Tools

| Method | Path | Description |
|--------|------|-------------|
| GET | \`/kagenti/tools\` | List tools (query: namespace) |
| POST | \`/kagenti/tools\` | Create a tool (admin) |
| GET | \`/kagenti/tools/:ns/:name\` | Get tool details |
| DELETE | \`/kagenti/tools/:ns/:name\` | Delete a tool (admin) |
| GET | \`/kagenti/tools/:ns/:name/route-status\` | Tool route/endpoint status |
| POST | \`/kagenti/tools/:ns/:name/connect\` | Connect to MCP server |
| POST | \`/kagenti/tools/:ns/:name/invoke\` | Invoke a tool |
| GET | \`/kagenti/tools/:ns/:name/build-info\` | Tool build information |
| POST | \`/kagenti/tools/:ns/:name/buildrun\` | Trigger tool build (admin) |

## Kagenti Sandbox

| Method | Path | Description |
|--------|------|-------------|
| GET | \`/kagenti/sandbox/defaults\` | Default sandbox configuration |
| POST | \`/kagenti/sandbox/:ns/sessions\` | Create sandbox session |
| GET | \`/kagenti/sandbox/:ns/sessions\` | List sandbox sessions |
| POST | \`/kagenti/sandbox/:ns/chat\` | Chat in sandbox |
| POST | \`/kagenti/sandbox/:ns/chat/stream\` | Streaming sandbox chat (SSE) |

## Kagenti Config & Admin

| Method | Path | Description |
|--------|------|-------------|
| GET | \`/kagenti/health\` | Kagenti runtime health |
| GET | \`/kagenti/config/features\` | Feature flags |
| GET | \`/kagenti/config/dashboards\` | Dashboard URLs |
| GET | \`/kagenti/namespaces\` | List enabled namespaces |
| GET | \`/kagenti/models\` | List LLM models |
`,
  },
];

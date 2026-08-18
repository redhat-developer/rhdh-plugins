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

/**
 * Tour step configuration -- matches the YAML schema.
 */
export interface TourStepConfig {
  target?: string;
  title: string;
  description?: string;
  side?: string;
  action?: {
    type: string;
    panel?: string;
    selector?: string;
    step?: number;
    method?: string;
    cardId?: string;
  };
  waitFor?: string;
}

/**
 * Tour definition -- matches the YAML schema.
 * Used by both backend (from YAML) and frontend (defaults + fetched).
 */
export interface TourDefinition {
  id: string;
  title: string;
  description?: string;
  category?: string;
  estimatedMinutes?: number;
  /** Which persona this tour is relevant to: developer, admin, or both */
  persona?: 'developer' | 'admin' | 'both';
  /** Which page this tour is designed for: marketplace, command-center, or any */
  page?: 'marketplace' | 'command-center' | 'any';
  steps: TourStepConfig[];
}

/**
 * Built-in default tours aligned with the current Command Center UI.
 * These are used when no YAML tours are configured.
 * All targets reference [data-tour="..."] attributes on current components.
 *
 * Tell-Show-Tell format:
 * - Title: short action label (what you're about to see)
 * - Description: context + what to do next
 */
export const DEFAULT_TOURS: TourDefinition[] = [
  // =========================================================================
  // MARKETPLACE WELCOME -- orientation for all users
  // =========================================================================
  {
    id: 'marketplace-welcome',
    title: 'Explore the Marketplace',
    description:
      'Get oriented with the Agent Marketplace -- browse, search, and chat with AI agents.',
    category: 'getting-started',
    persona: 'both',
    page: 'marketplace',
    estimatedMinutes: 2,
    steps: [
      {
        title: 'Welcome to the Agent Marketplace',
        description:
          'This is your front door to AI agents. Browse published agents, manage your own, create new ones, and start conversations.',
        action: { type: 'switchToMarketplace' },
      },
      {
        target: '[data-tour="marketplace-hero"]',
        title: 'Marketplace Header',
        description:
          'The hero area shows the marketplace title. Admins also see a "Command Center" link to access platform operations.',
        side: 'bottom',
      },
      {
        target: '[data-tour="marketplace-tabs"]',
        title: 'Explore and My Agents',
        description:
          'Two tabs: Explore shows all published agents and tools. My Agents shows everything you have created, with lifecycle tracking (Draft, In Review, Published).',
        side: 'bottom',
      },
      {
        target: '[data-tour="marketplace-search"]',
        title: 'Search and Filter',
        description:
          'Type to search agents by name or description. Use the framework chips below to filter by framework (LangGraph, ADK, CrewAI, etc.).',
        side: 'bottom',
      },
      {
        target: '[data-tour="marketplace-agent-grid"]',
        title: 'Agent Catalog',
        description:
          'Each card is an agent. The colored bar indicates the framework, and a green dot means the agent is ready. Click any card or the chat icon to start a conversation.',
        side: 'top',
      },
    ],
  },
  // =========================================================================
  // MARKETPLACE IMPORT AGENT -- deploy from image or Git source
  // =========================================================================
  {
    id: 'marketplace-import-agent',
    title: 'Import & Deploy an Agent',
    description:
      'Deploy an agent from a container image or Git repository, step by step.',
    category: 'agent-journeys',
    persona: 'both',
    page: 'marketplace',
    estimatedMinutes: 3,
    steps: [
      {
        target: '[data-tour="marketplace-create-agent-btn"]',
        title: 'Start Agent Creation',
        description:
          'Click "+ Create Agent" to open the creation dialog. We will walk through the Import path.',
        side: 'bottom',
        action: { type: 'switchToMarketplace' },
      },
      {
        target: '[data-tour="intent-dialog"]',
        title: 'Choose Import',
        description:
          'Three options appear: Import, Develop, and Configure. Select "Import" to deploy from a container image or build from Git source.',
        side: 'bottom',
        action: { type: 'openAgentIntent' },
        waitFor: '[data-tour="intent-dialog"]',
      },
      {
        target: '[data-tour="intent-import"]',
        title: 'Import Path',
        description:
          'This is the most common path for bringing existing agents to the platform. Click "Import" to continue to the creation wizard.',
        side: 'bottom',
        action: { type: 'selectAgentIntent', cardId: 'deploy' },
      },
      {
        target: '[data-tour="agent-name"]',
        title: 'Name and Configure',
        description:
          'Enter a unique name (lowercase, alphanumeric, hyphens). Choose a namespace, communication protocol (A2A, MCP, or HTTP), and framework (LangGraph, ADK, CrewAI, etc.).',
        side: 'right',
        waitFor: '[data-tour="agent-name"]',
      },
      {
        target: '[data-tour="deploy-method"]',
        title: 'Deployment Method',
        description:
          'Choose "Container Image" for a pre-built image, or "Source from Git" to build automatically via Shipwright. Each path has its own configuration fields below.',
        side: 'left',
        waitFor: '[data-tour="deploy-method"]',
      },
      {
        title: 'Complete the Wizard',
        description:
          'Fill in the image URL or Git details, then proceed to Runtime to set the workload type, environment variables, ports, and security toggles. Click "Create" to deploy your agent.',
        action: { type: 'closeDialogs' },
      },
    ],
  },
  // =========================================================================
  // MARKETPLACE DEVELOP AGENT -- templates and DevSpaces
  // =========================================================================
  {
    id: 'marketplace-develop-agent',
    title: 'Develop from Templates',
    description:
      'Start building an agent from a starter template or cloud IDE.',
    category: 'agent-journeys',
    persona: 'developer',
    page: 'marketplace',
    estimatedMinutes: 2,
    steps: [
      {
        target: '[data-tour="marketplace-create-agent-btn"]',
        title: 'Start Agent Creation',
        description:
          'Click "+ Create Agent" to open the creation dialog. We will walk through the Develop path.',
        side: 'bottom',
        action: { type: 'switchToMarketplace' },
      },
      {
        target: '[data-tour="intent-dialog"]',
        title: 'Choose Develop',
        description:
          'Three options appear: Import, Develop, and Configure. Select "Develop" to start from a template or cloud IDE.',
        side: 'bottom',
        action: { type: 'openAgentIntent' },
        waitFor: '[data-tour="intent-dialog"]',
      },
      {
        target: '[data-tour="intent-develop"]',
        title: 'Develop Path',
        description:
          'Select "Develop" to see two sub-options: "From Template" scaffolds a new project with best-practice code, and "Agent DevSpace" launches a cloud IDE with everything pre-configured.',
        side: 'bottom',
      },
      {
        target: '[data-tour="intent-templates"]',
        title: 'From Template',
        description:
          'Browse starter templates for frameworks like LangGraph, Google ADK, CrewAI, and Semantic Kernel. Each template includes pre-configured agent code, dependencies, and a Dockerfile.',
        side: 'bottom',
      },
      {
        target: '[data-tour="intent-devspaces"]',
        title: 'Agent DevSpace',
        description:
          'Launch a cloud IDE (Red Hat Dev Spaces) with the template pre-loaded. Your agent code lives in Git -- develop locally or in the cloud, then deploy when ready.',
        side: 'bottom',
        action: { type: 'closeDialogs' },
      },
    ],
  },
  // =========================================================================
  // MARKETPLACE CONFIGURE AGENT -- visual workflow builder
  // =========================================================================
  {
    id: 'marketplace-configure-agent',
    title: 'Configure with Workflow Builder',
    description:
      'Build multi-agent orchestration visually using the drag-and-drop editor.',
    category: 'agent-journeys',
    persona: 'developer',
    page: 'marketplace',
    estimatedMinutes: 1,
    steps: [
      {
        target: '[data-tour="marketplace-create-agent-btn"]',
        title: 'Start Agent Creation',
        description:
          'Click "+ Create Agent" to open the creation dialog. We will walk through the Configure path.',
        side: 'bottom',
        action: { type: 'switchToMarketplace' },
      },
      {
        target: '[data-tour="intent-dialog"]',
        title: 'Choose Configure',
        description:
          'Three options appear: Import, Develop, and Configure. Select "Configure" to use the visual workflow builder.',
        side: 'bottom',
        action: { type: 'openAgentIntent' },
        waitFor: '[data-tour="intent-dialog"]',
      },
      {
        target: '[data-tour="intent-configure"]',
        title: 'Visual Workflow Builder',
        description:
          'Select "Configure" to open the drag-and-drop workflow editor. Design multi-agent orchestration by connecting agent nodes, defining handoffs, attaching MCP tools, and setting guardrails.',
        side: 'bottom',
        action: { type: 'closeDialogs' },
      },
    ],
  },
  // =========================================================================
  // MARKETPLACE TOOL CREATION -- end-to-end from front door
  // =========================================================================
  {
    id: 'marketplace-create-tool',
    title: 'Create an MCP Tool',
    description:
      'Walk through registering an MCP tool server that extends agent capabilities.',
    category: 'agent-journeys',
    persona: 'both',
    page: 'marketplace',
    estimatedMinutes: 2,
    steps: [
      {
        target: '[data-tour="marketplace-create-tool-btn"]',
        title: 'Start Tool Creation',
        description: 'Click "+ Create Tool" to register a new MCP tool server.',
        side: 'bottom',
        action: { type: 'switchToMarketplace' },
      },
      {
        target: '[data-tour="tool-intent-dialog"]',
        title: 'Choose Your Path',
        description:
          'Two options: Develop to start from a template or DevSpace, or Deploy to deploy from a container image or Git source.',
        side: 'bottom',
        action: { type: 'openToolIntent' },
        waitFor: '[data-tour="tool-intent-dialog"]',
      },
      {
        target: '[data-tour="tool-intent-deploy"]',
        title: 'Deploy a Tool',
        description:
          'Select "Deploy" to register a tool from a container image or Git source. The wizard walks you through naming, namespace, deployment method, and runtime config.',
        side: 'bottom',
        action: { type: 'selectToolDeploy' },
      },
      {
        target: '[data-tour="tool-name"]',
        title: 'Configure Your Tool',
        description:
          'Name your tool, select a namespace, and provide a description. Choose a deployment method and configure runtime settings.',
        side: 'right',
        waitFor: '[data-tour="tool-name"]',
      },
      {
        title: 'Complete and Deploy',
        description:
          'Fill in deployment details, then configure runtime (workload type, environment variables, ports). Click "Create" to deploy. Tools start as Draft and need admin approval to be published.',
        action: { type: 'closeDialogs' },
      },
    ],
  },
  // =========================================================================
  // CC: OVERVIEW -- Command Center orientation (admin)
  // =========================================================================
  {
    id: 'cc-overview',
    title: 'Command Center Overview',
    description:
      'Get oriented with the Command Center layout, navigation, and key metrics.',
    category: 'getting-started',
    persona: 'admin',
    page: 'command-center',
    estimatedMinutes: 2,
    steps: [
      {
        target: '[data-tour="nav-overview"]',
        title: 'Command Center Navigation',
        description:
          'This top bar is your control panel. Four tabs: Overview for platform health, Agents for lifecycle management, Platform for infrastructure, Settings for customization.',
        side: 'bottom',
      },
      {
        target: '[data-tour="status-bar"]',
        title: 'Live Status Indicator',
        description:
          'Shows real-time platform health: Operational (green), Degraded (amber), or Critical (red). The ratio shows how many agents are ready.',
        side: 'bottom',
        action: { type: 'navigate', panel: 'ops-home' },
        waitFor: '[data-tour="status-bar"]',
      },
      {
        target: '[data-tour="metric-tiles"]',
        title: 'Fleet Metrics',
        description:
          'Four key numbers: total Agents deployed, how many are Ready, how many are Published to marketplace, and the review Queue count. Click Queue to jump to pending reviews.',
        side: 'bottom',
      },
      {
        target: '[data-tour="fleet-health"]',
        title: 'Agent Fleet Health',
        description:
          'Each colored tile is one agent. Green = healthy, amber = building, red = error. Hover any tile to see the agent name and status.',
        side: 'top',
      },
      {
        target: '[data-tour="back-to-marketplace"]',
        title: 'Back to Marketplace',
        description:
          'Click "Marketplace" anytime to return to the developer-facing Agent Marketplace where agents are browsed and chatted with.',
        side: 'bottom',
      },
    ],
  },
  // =========================================================================
  // CC: AGENTS -- Review Queue, Registry, Builds (admin)
  // =========================================================================
  {
    id: 'cc-agents',
    title: 'Agent Lifecycle Management',
    description:
      'Manage the full agent lifecycle: review submissions, browse the registry, and monitor builds.',
    category: 'admin-operations',
    persona: 'admin',
    page: 'command-center',
    estimatedMinutes: 2,
    steps: [
      {
        target: '[data-tour="nav-agents"]',
        title: 'Agents Tab',
        description:
          'The Agents tab is where you manage the full lifecycle of agents on the platform. It has three sub-sections: Review Queue, Registry, and Builds.',
        side: 'bottom',
        action: { type: 'navigate', panel: 'ops-review-queue' },
      },
      {
        target: '[data-tour="subtab-review-queue"]',
        title: 'Review Queue',
        description:
          'Agents created by developers start as Draft. When submitted, they appear here for review. Approve to publish them to the marketplace, or reject with feedback.',
        side: 'bottom',
        waitFor: '[data-tour="subtab-review-queue"]',
      },
      {
        target: '[data-tour="subtab-registry"]',
        title: 'Agent Registry',
        description:
          'Browse all registered agents across all namespaces. See their status, framework, protocol, and lifecycle stage. Click any agent to view details or manage it.',
        side: 'bottom',
        action: { type: 'navigate', panel: 'ops-registry' },
      },
      {
        target: '[data-tour="subtab-builds"]',
        title: 'Build Pipelines',
        description:
          'Monitor Shipwright build pipelines for agents deployed from Git source. Track build status, view logs, and retry failed builds.',
        side: 'bottom',
        action: { type: 'navigate', panel: 'kagenti-builds' },
      },
    ],
  },
  // =========================================================================
  // CC: PLATFORM -- Tools, Tool Review, Config, Observability (admin)
  // =========================================================================
  {
    id: 'cc-platform',
    title: 'Platform Infrastructure',
    description:
      'Tour the platform: MCP tools, configuration, and observability dashboards.',
    category: 'admin-operations',
    persona: 'admin',
    page: 'command-center',
    estimatedMinutes: 2,
    steps: [
      {
        target: '[data-tour="nav-platform"]',
        title: 'Platform Tab',
        description:
          'The Platform tab manages shared AI infrastructure used by all agents. It has four sub-sections: Tools, Tool Review, Config, and Observability.',
        side: 'bottom',
        action: { type: 'navigate', panel: 'kagenti-tools' },
      },
      {
        target: '[data-tour="subtab-tools"]',
        title: 'MCP Tools',
        description:
          'View and manage all registered MCP tool servers. Each tool shows its name, status, workload type, and actions (connect, invoke, delete). Click "New Tool" to register a new one.',
        side: 'bottom',
        waitFor: '[data-tour="subtab-tools"]',
      },
      {
        target: '[data-tour="subtab-tool-review"]',
        title: 'Tool Review',
        description:
          'Tools submitted by developers appear here for admin review. Approve to make them available to agents, or reject with feedback.',
        side: 'bottom',
        action: { type: 'navigate', panel: 'ops-tool-review' },
      },
      {
        target: '[data-tour="subtab-config"]',
        title: 'Platform Config',
        description:
          'Configure the LLM model endpoint, register MCP servers, set up RAG document sources, and define safety and evaluation rules.',
        side: 'bottom',
        action: { type: 'navigate', panel: 'ops-platform' },
      },
      {
        target: '[data-tour="subtab-observability"]',
        title: 'Observability',
        description:
          'Access Grafana dashboards for agent health and performance, distributed traces (Jaeger/Tempo), and service mesh traffic (Kiali).',
        side: 'bottom',
        action: { type: 'navigate', panel: 'ops-observability' },
      },
    ],
  },
  // =========================================================================
  // CC: SETTINGS -- Branding, Administration, Documentation (admin)
  // =========================================================================
  {
    id: 'cc-settings',
    title: 'Settings & Administration',
    description:
      'Customize branding, manage admin access, and browse platform documentation.',
    category: 'admin-operations',
    persona: 'admin',
    page: 'command-center',
    estimatedMinutes: 2,
    steps: [
      {
        target: '[data-tour="nav-settings"]',
        title: 'Settings Tab',
        description:
          'The Settings tab lets you customize the platform appearance, manage access, and access documentation. It has three sub-sections.',
        side: 'bottom',
        action: { type: 'navigate', panel: 'ops-branding' },
      },
      {
        target: '[data-tour="subtab-branding"]',
        title: 'Branding',
        description:
          'Customize the platform look and feel: change the app name, tagline, primary colors, bot avatar, and theme preset. Changes apply immediately across the UI.',
        side: 'bottom',
        waitFor: '[data-tour="subtab-branding"]',
      },
      {
        target: '[data-tour="subtab-admin"]',
        title: 'Administration',
        description:
          'Manage Kubernetes namespaces, configure admin access, and view platform-wide settings like security mode and provider configuration.',
        side: 'bottom',
        action: { type: 'navigate', panel: 'ops-admin' },
      },
      {
        target: '[data-tour="subtab-docs"]',
        title: 'Documentation',
        description:
          'Browse built-in platform documentation and guides. Covers architecture, API reference, configuration options, and troubleshooting.',
        side: 'bottom',
        action: { type: 'navigate', panel: 'ops-docs' },
      },
    ],
  },
];

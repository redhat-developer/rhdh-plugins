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

import type { DriveStep } from 'driver.js';
import type { AdminPanel } from '../../../hooks';

// ---------------------------------------------------------------------------
// Tour IDs & categories
// ---------------------------------------------------------------------------

export type TourId =
  | 'welcome'
  | 'agent-import-image'
  | 'agent-import-source'
  | 'agent-develop'
  | 'agent-configure'
  | 'tools'
  | 'operations';

export type TourCategory = 'getting-started' | 'agent-journeys' | 'platform';

export interface TourMeta {
  id: TourId;
  title: string;
  description: string;
  icon: TourId;
  category: TourCategory;
  estimatedMinutes: number;
}

export const TOUR_CATEGORIES: { key: TourCategory; label: string }[] = [
  { key: 'getting-started', label: 'Getting Started' },
  { key: 'agent-journeys', label: 'Deploy Your First Agent' },
  { key: 'platform', label: 'Platform Operations' },
];

export const TOUR_LIST: TourMeta[] = [
  {
    id: 'welcome',
    title: 'Explore Command Center',
    description:
      'Get a guided overview of the dashboard, navigation, and key areas so you can hit the ground running.',
    icon: 'welcome',
    category: 'getting-started',
    estimatedMinutes: 2,
  },
  {
    id: 'agent-import-image',
    title: 'Deploy from Container Image',
    description:
      'Walk through every wizard field to import and deploy an agent from a pre-built container image.',
    icon: 'agent-import-image',
    category: 'agent-journeys',
    estimatedMinutes: 3,
  },
  {
    id: 'agent-import-source',
    title: 'Build & Deploy from Source',
    description:
      'Step through the full wizard to build an agent from a Git repository using Shipwright pipelines.',
    icon: 'agent-import-source',
    category: 'agent-journeys',
    estimatedMinutes: 4,
  },
  {
    id: 'agent-develop',
    title: 'Develop with Templates',
    description:
      'Explore the development paths: scaffold from a template or launch a cloud DevSpace.',
    icon: 'agent-develop',
    category: 'agent-journeys',
    estimatedMinutes: 2,
  },
  {
    id: 'agent-configure',
    title: 'Configure Agents',
    description:
      'Walk through the agent configuration panel: agent identity, capabilities, connections and handoffs, advanced settings, instructions, and platform config.',
    icon: 'agent-configure',
    category: 'agent-journeys',
    estimatedMinutes: 3,
  },
  {
    id: 'tools',
    title: 'Manage MCP Tools',
    description:
      'Walk through the tool creation wizard and learn how to register, deploy, and connect tools to agents.',
    icon: 'tools',
    category: 'platform',
    estimatedMinutes: 3,
  },
  {
    id: 'operations',
    title: 'Platform Operations',
    description:
      'Explore build pipelines, sandbox testing, platform config, observability dashboards, and admin settings.',
    icon: 'operations',
    category: 'platform',
    estimatedMinutes: 2,
  },
];

export const TOUR_ORDER: TourId[] = TOUR_LIST.map(t => t.id);

export function getTourStepCount(id: TourId): number {
  return TOUR_STEPS[id]?.length ?? 0;
}

// ---------------------------------------------------------------------------
// Tour actions -- metadata that tells TourProvider what to do before
// highlighting a step. Actions run in onHighlightStarted, then the
// element is resolved lazily after the DOM updates.
// ---------------------------------------------------------------------------

export type TourAction =
  | { type: 'navigate'; panel: AdminPanel }
  | { type: 'openAgentIntent' }
  | { type: 'selectAgentIntent'; cardId: string }
  | { type: 'openToolIntent' }
  | { type: 'selectToolDeploy' }
  | { type: 'closeDialogs' }
  | { type: 'setWizardStep'; step: number }
  | { type: 'setDeployMethod'; method: string }
  | { type: 'clickSelector'; selector: string };

export interface EnhancedDriveStep extends DriveStep {
  tourAction?: TourAction;
  tourSelector?: string;
}

// ---------------------------------------------------------------------------
// Tour steps
// ---------------------------------------------------------------------------

export const TOUR_STEPS: Record<TourId, EnhancedDriveStep[]> = {
  // =====================================================================
  // WELCOME -- dashboard overview (no dialogs, stays as-is)
  // =====================================================================
  welcome: [
    {
      element: '[data-tour="nav-home"]',
      popover: {
        title: 'Welcome to Command Center',
        description:
          'This is your central hub for managing AI agents, tools, and infrastructure. Let\u2019s walk through the key areas.',
        side: 'right',
        align: 'center',
      },
    },
    {
      element: '[data-tour="stat-cards"]',
      popover: {
        title: 'At-a-Glance Metrics',
        description:
          'These cards show the health of your platform \u2014 total agents, how many are ready, tool status, and active namespaces.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="quick-actions"]',
      popover: {
        title: 'Quick Actions',
        description:
          'Create new agents, register MCP tools, or launch the Guided Experience with one click. This is the fastest way to get started.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-tour="health-table"]',
      popover: {
        title: 'Health Monitor',
        description:
          'Track the status of all deployed agents and tools. Click any row to view its details. Switch to the \u201cRecent Builds\u201d tab to see Shipwright build activity.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-tour="nav-agents"]',
      popover: {
        title: 'Sidebar Navigation',
        description:
          'Use the sidebar to switch between panels. \u201cAgentic Workloads\u201d covers agents, tools, builds, and sandbox. \u201cOperations\u201d covers platform config, observability, and admin.',
        side: 'right',
        align: 'center',
      },
    },
    {
      element: '[data-tour="back-to-chat"]',
      popover: {
        title: 'Back to Chat',
        description:
          'When you\u2019re done configuring, click here to return to the chat interface and interact with your agents.',
        side: 'right',
        align: 'center',
      },
    },
  ],

  // =====================================================================
  // DEPLOY FROM CONTAINER IMAGE -- end-to-end wizard walkthrough
  // =====================================================================
  'agent-import-image': [
    {
      tourAction: { type: 'navigate', panel: 'kagenti-agents' },
      tourSelector: '[data-tour="new-agent-btn"]',
      popover: {
        title: 'Step 1: Open the Agents Panel',
        description:
          'Start by navigating to the Agents panel. Click "New Agent" to begin the import process.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      tourAction: { type: 'openAgentIntent' },
      tourSelector: '[data-tour="intent-import"]',
      popover: {
        title: 'Step 2: Choose "Import"',
        description:
          'Select "Import" to bring an existing agent onto the platform. This opens the creation wizard where you\u2019ll configure your agent.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      tourAction: { type: 'selectAgentIntent', cardId: 'deploy' },
      tourSelector: '[data-tour="agent-name"]',
      popover: {
        title: 'Step 3: Name Your Agent',
        description:
          'Enter a unique name for your agent (DNS-1123 label). Choose the target namespace and communication protocol (A2A, MCP, or HTTP).',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      tourSelector: '[data-tour="agent-protocol"]',
      popover: {
        title: 'Step 4: Select Protocol',
        description:
          'Choose the communication protocol: A2A for agent-to-agent, MCP for model context protocol, or HTTP for standard REST endpoints.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      tourAction: { type: 'setWizardStep', step: 1 },
      tourSelector: '[data-tour="deploy-method"]',
      popover: {
        title: 'Step 5: Deployment Method',
        description:
          'The default deployment method is "Container Image," which deploys a pre-built image directly to your cluster without building from source.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      tourSelector: '[data-tour="deploy-container-image"]',
      popover: {
        title: 'Step 6: Container Image URL',
        description:
          'Provide the full image URL (e.g., ghcr.io/org/my-agent:latest). Optionally add an image pull secret if your registry requires authentication.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      tourAction: { type: 'setWizardStep', step: 2 },
      tourSelector: '[data-tour="runtime-workload"]',
      popover: {
        title: 'Step 7: Runtime Configuration',
        description:
          'Configure the workload type (Deployment for stateless, StatefulSet for persistent, Job for one-off tasks). Add environment variables, service ports, and security settings.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      tourSelector: '[data-tour="runtime-security"]',
      popover: {
        title: 'Step 8: Security & Submit',
        description:
          'Enable HTTP routes, auth bridge, and SPIRE identity as needed. When ready, click "Create" to deploy your agent. You\u2019re all set!',
        side: 'top',
        align: 'center',
      },
    },
  ],

  // =====================================================================
  // BUILD & DEPLOY FROM SOURCE -- end-to-end wizard walkthrough
  // =====================================================================
  'agent-import-source': [
    {
      tourAction: { type: 'navigate', panel: 'kagenti-agents' },
      tourSelector: '[data-tour="new-agent-btn"]',
      popover: {
        title: 'Step 1: Open the Agents Panel',
        description:
          'Navigate to the Agents panel and click "New Agent" to start the import wizard.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      tourAction: { type: 'openAgentIntent' },
      tourSelector: '[data-tour="intent-import"]',
      popover: {
        title: 'Step 2: Choose "Import"',
        description:
          'Select "Import" to bring an agent onto the platform. In the next step, you\u2019ll choose to build from source code.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      tourAction: { type: 'selectAgentIntent', cardId: 'deploy' },
      tourSelector: '[data-tour="agent-name"]',
      popover: {
        title: 'Step 3: Name & Protocol',
        description:
          'Enter a unique agent name and select the namespace. Choose the communication protocol that matches your agent\u2019s API.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      tourAction: { type: 'setWizardStep', step: 1 },
      tourSelector: '[data-tour="deploy-method"]',
      popover: {
        title: 'Step 4: Select "Source from Git"',
        description:
          'Choose "Source from Git" as the deployment method. This triggers a Shipwright build pipeline that clones your repo, builds a container image, and pushes it to the registry.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      tourAction: { type: 'setDeployMethod', method: 'source' },
      tourSelector: '[data-tour="deploy-git-url"]',
      popover: {
        title: 'Step 5: Git Repository URL',
        description:
          'Enter the Git repository URL containing your agent source code (e.g., https://github.com/org/my-agent.git). Optionally specify a branch and subdirectory.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      tourSelector: '[data-tour="deploy-registry"]',
      popover: {
        title: 'Step 6: Registry URL',
        description:
          'The registry URL determines where the built image is pushed. OpenShift\u2019s internal registry auto-includes the namespace (e.g., image-registry.openshift-image-registry.svc:5000/team1).',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      tourSelector: '[data-tour="deploy-build-config"]',
      popover: {
        title: 'Step 7: Build Configuration',
        description:
          'Select a Shipwright build strategy, set the Dockerfile path, and configure the build timeout. Add build arguments for custom build-time variables.',
        side: 'top',
        align: 'center',
      },
    },
    {
      tourAction: { type: 'setWizardStep', step: 2 },
      tourSelector: '[data-tour="runtime-workload"]',
      popover: {
        title: 'Step 8: Runtime Settings',
        description:
          'Configure the workload type, environment variables, ports, and security. These settings apply to the deployed agent after the build completes.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      tourSelector: '[data-tour="runtime-security"]',
      popover: {
        title: 'Step 9: Submit & Build',
        description:
          'Click "Start Build" to trigger the Shipwright pipeline. Monitor build progress in the Build Pipelines panel. Your agent appears in the Health Monitor once deployed.',
        side: 'top',
        align: 'center',
      },
    },
  ],

  // =====================================================================
  // DEVELOP WITH TEMPLATES -- intent dialog sub-options
  // =====================================================================
  'agent-develop': [
    {
      tourAction: { type: 'navigate', panel: 'kagenti-agents' },
      tourSelector: '[data-tour="new-agent-btn"]',
      popover: {
        title: 'Step 1: Open the Agents Panel',
        description:
          'Go to the Agents panel and click "New Agent" to see the development options.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      tourAction: { type: 'openAgentIntent' },
      tourSelector: '[data-tour="intent-develop"]',
      popover: {
        title: 'Step 2: Choose "Develop"',
        description:
          'Select "Develop" to scaffold a new agent project or launch a cloud development environment.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      tourAction: { type: 'selectAgentIntent', cardId: 'develop' },
      tourSelector: '[data-tour="intent-templates"]',
      popover: {
        title: 'Step 3: From Template',
        description:
          'Choose "From Template" to scaffold a new agent project from a pre-configured software template with best-practice structure, dependencies, and CI/CD.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      tourSelector: '[data-tour="intent-devspaces"]',
      popover: {
        title: 'Step 4: Agent DevSpace',
        description:
          'Or choose "Agent DevSpace" to launch a cloud IDE (Red Hat Dev Spaces) with your agent repo, tools, and runtime pre-configured. After developing, return here to import via Image or Source.',
        side: 'bottom',
        align: 'center',
      },
    },
  ],

  // =====================================================================
  // CONFIGURE AGENTS
  // =====================================================================
  'agent-configure': [
    {
      tourAction: { type: 'navigate', panel: 'kagenti-agents' },
      tourSelector: '[data-tour="new-agent-btn"]',
      popover: {
        title: 'Step 1: Open the Agents Panel',
        description:
          'Navigate to the Agents panel and click "New Agent" to begin creating an agent.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      tourAction: { type: 'openAgentIntent' },
      tourSelector: '[data-tour="intent-configure"]',
      popover: {
        title: 'Step 2: Choose "Configure"',
        description:
          'Select "Configure" to define agent roles, instructions, models, and routing rules.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      tourAction: { type: 'selectAgentIntent', cardId: 'configure' },
      tourSelector: '[data-tour="intent-configure-single"]',
      popover: {
        title: 'Step 3: Single Agent',
        description:
          'Choose "Single Agent" to create a standalone agent with its own instructions, model, and tools. Ideal for focused tasks like Q&A, code review, or data analysis.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      tourSelector: '[data-tour="intent-configure-multi"]',
      popover: {
        title: 'Step 4: Multi Agent',
        description:
          'Or choose "Multi Agent" to create a team of agents with a router that hands off to specialists. Best for complex workflows that require different expertise.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      tourAction: { type: 'selectAgentIntent', cardId: 'configure-single' },
      tourSelector: '[data-tour="orch-toolbar"]',
      popover: {
        title: 'Step 5: Agent Toolbar',
        description:
          'The toolbar lets you create new agents, save your configuration, and \u2014 when you have multiple agents \u2014 select the Starting Agent and set Max Turns.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      tourSelector: '[data-tour="orch-agent-list"]',
      popover: {
        title: 'Step 6: Agent List',
        description:
          'The left panel lists all configured agents. Each shows its name, connection counts (in/out), and whether it\u2019s the default starting agent. Click any agent to configure it on the right.',
        side: 'right',
        align: 'center',
      },
    },
    {
      tourSelector: '[data-tour="orch-identity"]',
      popover: {
        title: 'Step 7: Agent Identity',
        description:
          'Set the agent\u2019s display name and handoff description. The description is critical \u2014 other agents read it when deciding whether to route a request to this agent.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      tourSelector: '[data-tour="orch-tabs"]',
      popover: {
        title: 'Step 8: Configuration Tabs',
        description:
          'Each agent has four configuration areas: Capabilities (model & tools), Connections (handoffs & delegation), Advanced (parameters & guardrails), and Instructions (agent behavior).',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      tourAction: {
        type: 'clickSelector',
        selector: '[data-tour="orch-tab-capabilities"]',
      },
      tourSelector: '[data-tour="orch-capabilities"]',
      popover: {
        title: 'Step 9: Capabilities',
        description:
          'Assign a model override, connect MCP tool servers, and enable built-in tools like Knowledge Base (RAG), Web Search, and Code Interpreter.',
        side: 'left',
        align: 'start',
      },
    },
    {
      tourAction: {
        type: 'clickSelector',
        selector: '[data-tour="orch-tab-connections"]',
      },
      tourSelector: '[data-tour="orch-tabs"]',
      popover: {
        title: 'Step 10: Connections',
        description:
          'When you add handoffs or delegation between agents, the Connections tab appears here. Define "Can Transfer To" (the target agent takes over) and "Can Delegate To" (runs as a background sub-task). The Agent Topology visualizes all routing paths.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      tourAction: {
        type: 'clickSelector',
        selector: '[data-tour="orch-tab-advanced"]',
      },
      tourSelector: '[data-tour="orch-advanced"]',
      popover: {
        title: 'Step 11: Advanced Settings',
        description:
          'Fine-tune Tool Choice, Reasoning effort, Temperature, Max Output Tokens, Max Tool Calls, and Guardrails. Toggle options like "Reset Tool Choice After Use" and "Summarize History on Handoff."',
        side: 'left',
        align: 'start',
      },
    },
    {
      tourAction: {
        type: 'clickSelector',
        selector: '[data-tour="orch-tab-instructions"]',
      },
      tourSelector: '[data-tour="orch-instructions"]',
      popover: {
        title: 'Step 12: Instructions',
        description:
          'Write agent instructions manually or use AI generation. Provide a description and the system auto-generates instructions based on the agent\u2019s capabilities, connections, and tools.',
        side: 'left',
        align: 'start',
      },
    },
    {
      tourSelector: '[data-tour="nav-platform"]',
      popover: {
        title: 'Step 13: Platform Config',
        description:
          'Global models, MCP servers, RAG knowledge bases, and guardrails are managed in Platform Config. These shared resources are available to all configured agents.',
        side: 'right',
        align: 'center',
      },
    },
  ],

  // =====================================================================
  // MANAGE MCP TOOLS -- end-to-end tool wizard walkthrough
  // =====================================================================
  tools: [
    {
      tourAction: { type: 'navigate', panel: 'kagenti-tools' },
      tourSelector: '[data-tour="new-tool-btn"]',
      popover: {
        title: 'Step 1: Open the Tools Panel',
        description:
          'Navigate to the Tools panel. MCP tools extend your agents\u2019 capabilities \u2014 web search, database access, API calls, and more.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      tourAction: { type: 'openToolIntent' },
      tourSelector: '[data-tour="tool-intent-deploy"]',
      popover: {
        title: 'Step 2: Choose "Deploy"',
        description:
          'Select "Deploy" to bring an existing MCP tool onto the platform from a container image or Git repository.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      tourAction: { type: 'selectToolDeploy' },
      tourSelector: '[data-tour="tool-name"]',
      popover: {
        title: 'Step 3: Name Your Tool',
        description:
          'Enter a unique tool name, select the namespace, and choose the MCP protocol. Optionally add a description so agents know when to use this tool.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      tourAction: { type: 'setWizardStep', step: 1 },
      tourSelector: '[data-tour="tool-deploy-method"]',
      popover: {
        title: 'Step 4: Deployment Method',
        description:
          'Choose "Container Image" for a pre-built tool or "Source from Git" to build from a repository. The same Shipwright pipeline system handles tool builds.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      tourAction: { type: 'setWizardStep', step: 2 },
      tourSelector: '[data-tour="tool-runtime-workload"]',
      popover: {
        title: 'Step 5: Runtime & Security',
        description:
          'Configure workload type, environment variables, ports, and security settings. Tools support persistent storage for stateful operations.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      tourAction: { type: 'closeDialogs' },
      tourSelector: '[data-tour="nav-platform"]',
      popover: {
        title: 'Step 6: Connect Tools to Agents',
        description:
          'After deploying, go to Platform Config \u2192 MCP Servers to configure which agents can access your tool. Monitor tool health in the dashboard.',
        side: 'right',
        align: 'center',
      },
    },
  ],

  // =====================================================================
  // PLATFORM OPERATIONS -- sidebar-only overview (stays as-is)
  // =====================================================================
  operations: [
    {
      element: '[data-tour="nav-builds"]',
      popover: {
        title: 'Build Pipelines',
        description:
          'View all Shipwright builds across agents and tools. Trigger manual rebuilds when source code changes.',
        side: 'right',
        align: 'center',
      },
    },
    {
      element: '[data-tour="nav-sandbox"]',
      popover: {
        title: 'Sandbox',
        description:
          'Launch isolated testing environments for agents. Create sessions, inspect conversations, and validate behavior before production.',
        side: 'right',
        align: 'center',
      },
    },
    {
      element: '[data-tour="nav-platform"]',
      popover: {
        title: 'Platform Config',
        description:
          'The shared AI infrastructure: configure LLM model endpoints, register MCP tool servers, set up RAG knowledge bases, and define safety guardrails.',
        side: 'right',
        align: 'center',
      },
    },
    {
      element: '[data-tour="nav-observability"]',
      popover: {
        title: 'Observability',
        description:
          'Access dashboards for distributed tracing, network traffic monitoring, and MCP debugging tools.',
        side: 'right',
        align: 'center',
      },
    },
    {
      element: '[data-tour="nav-admin"]',
      popover: {
        title: 'Administration',
        description:
          'Manage identity (Keycloak), namespaces, build strategies, DevSpaces config, LLM teams, API keys, and integrations.',
        side: 'right',
        align: 'center',
      },
    },
  ],
};

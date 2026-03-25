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

export interface AgentFormData {
  name: string;
  instructions: string;
  handoffDescription: string;
  model: string;
  handoffs: string[];
  asTools: string[];
  mcpServers: string[];
  enableRAG: boolean;
  vectorStoreIds: string[];
  enableWebSearch: boolean;
  enableCodeInterpreter: boolean;
  toolChoice?: 'auto' | 'required' | 'none';
  temperature?: number;
  maxOutputTokens?: number;
  maxToolCalls?: number;
  guardrails?: string[];
  reasoning?: { effort: 'low' | 'medium' | 'high' };
  resetToolChoice?: boolean;
  nestHandoffHistory?: boolean;
}

export function createDefaultAgent(): AgentFormData {
  return {
    name: '',
    instructions: '',
    handoffDescription: '',
    model: '',
    handoffs: [],
    asTools: [],
    mcpServers: [],
    enableRAG: false,
    vectorStoreIds: [],
    enableWebSearch: false,
    enableCodeInterpreter: false,
  };
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

export function agentFromConfig(cfg: Record<string, unknown>): AgentFormData {
  const base: AgentFormData = {
    name: typeof cfg.name === 'string' ? cfg.name : '',
    instructions: typeof cfg.instructions === 'string' ? cfg.instructions : '',
    handoffDescription:
      typeof cfg.handoffDescription === 'string' ? cfg.handoffDescription : '',
    model: typeof cfg.model === 'string' ? cfg.model : '',
    handoffs: toStringArray(cfg.handoffs),
    asTools: toStringArray(cfg.asTools),
    mcpServers: toStringArray(cfg.mcpServers),
    enableRAG: Boolean(cfg.enableRAG),
    vectorStoreIds: toStringArray(cfg.vectorStoreIds),
    enableWebSearch: Boolean(cfg.enableWebSearch),
    enableCodeInterpreter: Boolean(cfg.enableCodeInterpreter),
  };

  if (
    typeof cfg.toolChoice === 'string' &&
    ['auto', 'required', 'none'].includes(cfg.toolChoice)
  ) {
    base.toolChoice = cfg.toolChoice as 'auto' | 'required' | 'none';
  }
  if (typeof cfg.temperature === 'number' && !isNaN(cfg.temperature))
    base.temperature = cfg.temperature;
  if (typeof cfg.maxOutputTokens === 'number' && !isNaN(cfg.maxOutputTokens))
    base.maxOutputTokens = cfg.maxOutputTokens;
  if (typeof cfg.maxToolCalls === 'number' && !isNaN(cfg.maxToolCalls))
    base.maxToolCalls = cfg.maxToolCalls;
  if (Array.isArray(cfg.guardrails))
    base.guardrails = toStringArray(cfg.guardrails);
  if (cfg.reasoning && typeof cfg.reasoning === 'object') {
    const r = cfg.reasoning as Record<string, unknown>;
    if (
      typeof r.effort === 'string' &&
      ['low', 'medium', 'high'].includes(r.effort)
    ) {
      base.reasoning = { effort: r.effort as 'low' | 'medium' | 'high' };
    }
  }
  if (typeof cfg.resetToolChoice === 'boolean')
    base.resetToolChoice = cfg.resetToolChoice;
  if (typeof cfg.nestHandoffHistory === 'boolean')
    base.nestHandoffHistory = cfg.nestHandoffHistory;

  return base;
}

export function detectCircularHandoffs(
  agents: Record<string, AgentFormData>,
): string[] {
  const warnings: string[] = [];

  for (const [key, agent] of Object.entries(agents)) {
    if (agent.handoffs.includes(key)) {
      warnings.push(
        `"${agent.name || key}" hands off to itself — this will cause an infinite loop.`,
      );
    }
  }

  return warnings;
}

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

export function validateAgents(
  agents: Record<string, AgentFormData>,
  defaultAgentKey: string,
): ValidationResult {
  const errors: string[] = [];
  const agentKeys = Object.keys(agents);

  for (const [key, agent] of Object.entries(agents)) {
    if (!agent.name.trim()) errors.push(`Agent "${key}" has no name`);
    if (!agent.instructions.trim())
      errors.push(`Agent "${key}" has no instructions`);
    for (const h of agent.handoffs) {
      if (!agents[h]) errors.push(`Agent "${key}" hands off to unknown "${h}"`);
    }
    for (const t of agent.asTools) {
      if (!agents[t])
        errors.push(`Agent "${key}" calls unknown agent "${t}" as tool`);
    }
  }
  if (agentKeys.length > 0 && !agents[defaultAgentKey]) {
    errors.push(`Default agent "${defaultAgentKey}" not found`);
  }

  const warnings = detectCircularHandoffs(agents);
  warnings.push(...detectSmartWarnings(agents, defaultAgentKey));

  return { errors, warnings };
}

/**
 * Summarize an agent's configured capabilities, connections, and settings
 * into a text block suitable for inclusion in a prompt-generation meta-prompt.
 */
export function buildAgentContext(
  agent: AgentFormData,
  allAgents: Record<string, AgentFormData>,
  availableMcpServers: Array<{ id: string; name: string }>,
): string {
  const lines: string[] = [];

  lines.push(`Model: ${agent.model || 'global default'}`);

  const tools: string[] = [];
  if (agent.enableRAG) tools.push('Knowledge Base (RAG)');
  if (agent.enableWebSearch) tools.push('Web Search');
  if (agent.enableCodeInterpreter) tools.push('Code Interpreter');
  lines.push(`Built-in tools: ${tools.length > 0 ? tools.join(', ') : 'none'}`);

  if (agent.mcpServers.length > 0) {
    const names = agent.mcpServers.map(
      id => availableMcpServers.find(s => s.id === id)?.name || id,
    );
    lines.push(`MCP Servers: ${names.join(', ')}`);
  }

  if (agent.handoffs.length > 0) {
    const targets = agent.handoffs
      .filter(k => allAgents[k])
      .map(k => {
        const desc = allAgents[k].handoffDescription;
        return desc
          ? `${allAgents[k].name || k} (${desc})`
          : allAgents[k].name || k;
      });
    if (targets.length > 0)
      lines.push(`Can transfer to: ${targets.join(', ')}`);
  }

  if (agent.asTools.length > 0) {
    const workers = agent.asTools
      .filter(k => allAgents[k])
      .map(k => {
        const desc = allAgents[k].handoffDescription;
        return desc
          ? `${allAgents[k].name || k} (${desc})`
          : allAgents[k].name || k;
      });
    if (workers.length > 0)
      lines.push(`Can delegate to: ${workers.join(', ')}`);
  }

  if (agent.toolChoice) lines.push(`Tool choice: ${agent.toolChoice}`);
  if (agent.temperature !== undefined)
    lines.push(`Temperature: ${agent.temperature}`);

  return lines.join('\n');
}

function detectSmartWarnings(
  agents: Record<string, AgentFormData>,
  defaultAgentKey: string,
): string[] {
  const warnings: string[] = [];
  const agentKeys = Object.keys(agents);

  for (const [key, agent] of Object.entries(agents)) {
    const hasTools =
      agent.mcpServers.length > 0 ||
      agent.enableRAG ||
      agent.enableWebSearch ||
      agent.enableCodeInterpreter;
    const hasHandoffs = agent.handoffs.length > 0;

    if (agent.toolChoice === 'required' && hasHandoffs && hasTools) {
      warnings.push(
        `"${agent.name || key}" has toolChoice=required and handoffs but also has tools enabled. Consider removing tools if this agent only routes.`,
      );
    }

    const isHandoffTarget = agentKeys.some(
      k =>
        k !== key &&
        (agents[k].handoffs.includes(key) || agents[k].asTools.includes(key)),
    );
    if (isHandoffTarget && !agent.handoffDescription.trim()) {
      warnings.push(
        `"${agent.name || key}" is a handoff target but has no handoff description. Other agents won't know when to route here.`,
      );
    }

    if (
      key === defaultAgentKey &&
      agentKeys.length > 1 &&
      !hasHandoffs &&
      agent.asTools.length === 0
    ) {
      warnings.push(
        `"${agent.name || key}" is the starting agent but has no handoffs or delegates. In a multi-agent setup, users may get stuck.`,
      );
    }
  }

  return warnings;
}

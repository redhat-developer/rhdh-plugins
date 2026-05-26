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

import type {
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import type { AgentConfig, ToolChoiceConfig } from '../../../types';
import { parseTruncation } from './ConfigParsers';

function asStringArray(val: unknown): string[] | undefined {
  return Array.isArray(val) ? (val as string[]) : undefined;
}

function warnIfNotArray(
  raw: Record<string, unknown>,
  key: string,
  field: string,
  logger: LoggerService,
): void {
  if (raw[field] && !Array.isArray(raw[field]))
    logger.warn(
      `[MultiAgent] Agent "${key}": ${field} should be an array, got ${typeof raw[field]}. Ignoring.`,
    );
}

export function parseSingleAgent(
  key: string,
  value: unknown,
  logger: LoggerService,
): AgentConfig | undefined {
  if (!value || typeof value !== 'object') {
    logger.warn(`[MultiAgent] Skipping invalid agent config: "${key}"`);
    return undefined;
  }
  const raw = value as Record<string, unknown>;
  if (typeof raw.name !== 'string' || typeof raw.instructions !== 'string') {
    logger.warn(
      `[MultiAgent] Agent "${key}" missing required 'name' or 'instructions', skipping`,
    );
    return undefined;
  }
  warnIfNotArray(raw, key, 'mcpServers', logger);
  warnIfNotArray(raw, key, 'handoffs', logger);
  warnIfNotArray(raw, key, 'asTools', logger);
  warnIfNotArray(raw, key, 'vectorStoreIds', logger);
  return {
    name: raw.name,
    instructions: raw.instructions,
    handoffDescription: raw.handoffDescription as string | undefined,
    model: raw.model as string | undefined,
    mcpServers: asStringArray(raw.mcpServers),
    handoffs: asStringArray(raw.handoffs),
    asTools: asStringArray(raw.asTools),
    enableRAG: raw.enableRAG as boolean | undefined,
    vectorStoreIds: asStringArray(raw.vectorStoreIds),
    enableWebSearch: raw.enableWebSearch as boolean | undefined,
    enableCodeInterpreter: raw.enableCodeInterpreter as boolean | undefined,
    functions: raw.functions as AgentConfig['functions'] | undefined,
    toolChoice: raw.toolChoice as ToolChoiceConfig | undefined,
    reasoning: raw.reasoning as AgentConfig['reasoning'] | undefined,
    inheritSystemPrompt: raw.inheritSystemPrompt as boolean | undefined,
    handoffInputSchema: raw.handoffInputSchema as
      | Record<string, unknown>
      | undefined,
    handoffInputFilter: raw.handoffInputFilter as
      | AgentConfig['handoffInputFilter']
      | undefined,
    toolUseBehavior: raw.toolUseBehavior as
      | AgentConfig['toolUseBehavior']
      | undefined,
    outputSchema: raw.outputSchema as AgentConfig['outputSchema'] | undefined,
    enabled: raw.enabled as boolean | undefined,
    toolGuardrails: Array.isArray(raw.toolGuardrails)
      ? (raw.toolGuardrails as AgentConfig['toolGuardrails'])
      : undefined,
    guardrails: asStringArray(raw.guardrails),
    maxToolCalls:
      typeof raw.maxToolCalls === 'number' ? raw.maxToolCalls : undefined,
    maxOutputTokens:
      typeof raw.maxOutputTokens === 'number' ? raw.maxOutputTokens : undefined,
    temperature:
      typeof raw.temperature === 'number' ? raw.temperature : undefined,
    truncation: parseTruncation(raw.truncation as string | undefined),
    publishAs: (() => {
      if (raw.publishAs === undefined) return undefined;
      if (
        typeof raw.publishAs === 'string' &&
        ['router', 'specialist', 'standalone'].includes(raw.publishAs)
      )
        return raw.publishAs as 'router' | 'specialist' | 'standalone';
      logger.warn(
        `[MultiAgent] Agent "${key}": publishAs must be "router", "specialist", or "standalone". Ignoring.`,
      );
      return undefined;
    })(),
  };
}

export function parseAgentConfigs(
  config: RootConfigService,
  logger: LoggerService,
):
  | {
      agents: Record<string, AgentConfig>;
      defaultAgent: string;
      maxAgentTurns?: number;
    }
  | undefined {
  const agentsRaw = config.getOptional('augment.agents') as
    | Record<string, unknown>
    | undefined;
  if (!agentsRaw || typeof agentsRaw !== 'object') return undefined;
  const agents: Record<string, AgentConfig> = {};
  for (const [key, value] of Object.entries(agentsRaw)) {
    const agent = parseSingleAgent(key, value, logger);
    if (agent) agents[key] = agent;
  }
  if (Object.keys(agents).length === 0) {
    logger.info('[MultiAgent] No valid agent definitions found');
    return undefined;
  }
  const defaultAgent =
    (config.getOptionalString('augment.defaultAgent') as string) ||
    Object.keys(agents)[0];
  const maxAgentTurns = config.getOptionalNumber('augment.maxAgentTurns');
  logger.info(
    `[MultiAgent] Loaded ${Object.keys(agents).length} agent(s): [${Object.keys(agents).join(', ')}], default="${defaultAgent}", maxTurns=${maxAgentTurns ?? 'unlimited'}`,
  );
  return { agents, defaultAgent, maxAgentTurns };
}

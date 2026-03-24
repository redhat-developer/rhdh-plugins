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
 * Agent graph types and resolution — delegates to the ADK.
 *
 * This module re-exports the core graph types from `@augment-adk/augment-adk`
 * and adds plugin-specific callback types (BuildDepsForAgent, etc.) that
 * reference Backstage service interfaces.
 *
 * The `resolveAgentGraph` function wraps the ADK's version, adapting the
 * Backstage LoggerService to the ADK's ILogger interface.
 */
import type { LoggerService } from '@backstage/backend-plugin-api';
import {
  resolveAgentGraph as adkResolveAgentGraph,
  sanitizeName,
  type AgentGraphSnapshot as AdkSnapshot,
  type ResolvedAgent as AdkResolvedAgent,
} from '@augment-adk/augment-adk';
import { toAdkLogger } from '../../llamastack/adk-adapters/BackstageLoggerAdapter';
import type { ChatDeps } from '../chat/ResponsesApiService';
import type {
  AgentConfig,
  ChatResponse,
  ResponsesApiInputItem,
  ResponsesApiResponse,
} from '../../../types';

/*
 * Re-export ADK types. Plugin AgentConfig is a structural superset of
 * ADK AgentConfig (adding only the deprecated `inheritSystemPrompt`),
 * so the cast is safe at runtime.
 */
export type ResolvedAgent = AdkResolvedAgent;
export type AgentGraphSnapshot = AdkSnapshot;

/** Alias for ADK's sanitizeName — kept for backward compatibility. */
export const toFunctionToolName = sanitizeName;

/** Callback the orchestrator provides to build per-agent ChatDeps. */
export type BuildDepsForAgent = (agent: ResolvedAgent) => Promise<ChatDeps>;

/** Callback invoked when the runner exceeds maxTurns. */
export type MaxTurnsExceededHandler = (ctx: {
  agentPath: string[];
  lastResponse?: ResponsesApiResponse;
}) => ChatResponse | undefined;

/** Pre-model-call hook: can inspect/modify the input before each chatTurn. */
export type InputFilterFn = (
  input: string | ResponsesApiInputItem[],
  agentKey: string,
  turn: number,
) => string | ResponsesApiInputItem[];

/** Customizable formatter for tool execution errors. */
export type ToolErrorFormatterFn = (toolName: string, error: string) => string;

/**
 * Build and validate an AgentGraphSnapshot from raw AgentConfig records.
 *
 * Delegates to the ADK's `resolveAgentGraph`, adapting the Backstage
 * LoggerService to the ADK's ILogger interface.
 */
export function resolveAgentGraph(
  configs: Record<string, AgentConfig>,
  defaultAgent: string,
  maxAgentTurns: number | undefined,
  logger: LoggerService,
): AgentGraphSnapshot {
  return adkResolveAgentGraph(
    configs as Record<string, import('@augment-adk/augment-adk').AgentConfig>,
    defaultAgent,
    maxAgentTurns,
    toAdkLogger(logger),
  );
}

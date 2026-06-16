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
  NormalizedStreamEvent,
  ChatAgent,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { ChatRequest, ChatResponse } from '../types';
import type {
  ConversationCapability,
  RAGCapability,
  SafetyCapability,
  EvaluationCapability,
  AgenticProviderStatus,
} from './capabilityTypes';

/**
 * AgenticProvider is the abstraction boundary between the Backstage plugin
 * and the underlying AI/agentic runtime (Llama Stack, ADK, LangGraph, etc.).
 *
 * The router and plugin lifecycle interact ONLY through this interface.
 * Provider-specific code lives entirely within the provider implementation.
 *
 * @public
 */
export interface AgenticProvider {
  /** Unique identifier for this provider type (e.g., 'llamastack', 'adk') */
  readonly id: string;

  /** Human-readable display name */
  readonly displayName: string;

  initialize(): Promise<void>;

  postInitialize(): Promise<void>;

  getStatus(): Promise<AgenticProviderStatus>;

  chat(request: ChatRequest): Promise<ChatResponse>;

  chatStream(
    request: ChatRequest,
    onEvent: (event: NormalizedStreamEvent) => void,
    signal?: AbortSignal,
  ): Promise<void>;

  shutdown?(): Promise<void>;

  invalidateRuntimeConfig?(): void;

  refreshDynamicConfig?(): Promise<void>;

  getEffectiveConfig?(): Promise<Record<string, unknown>>;

  generateSystemPrompt?(
    description: string,
    model?: string,
    capabilities?: import('@red-hat-developer-hub/backstage-plugin-augment-common').PromptCapabilities,
  ): Promise<string>;

  listAgents?(): Promise<ChatAgent[]>;

  listModels?(): Promise<
    Array<{ id: string; owned_by?: string; model_type?: string }>
  >;

  testModel?(
    model?: string,
    baseUrl?: string,
  ): Promise<{
    connected: boolean;
    modelFound: boolean;
    canGenerate: boolean;
    error?: string;
  }>;

  // ---- Optional capabilities ----

  conversations?: ConversationCapability;

  rag?: RAGCapability;

  safety?: SafetyCapability;

  evaluation?: EvaluationCapability;

  // ---- Lifecycle & context methods (capability-gated) ----

  registerRoutes?(router: import('express').Router, deps: unknown): void;

  setUserContext?(userRef: string): void;

  getSessionContextId?(backstageSessionId: string): Promise<string | undefined>;

  hydrateSessionContext?(
    backstageSessionId: string,
    contextId: string,
    model?: string,
  ): Promise<void>;

  submitApproval?(approval: {
    responseId: string;
    callId: string;
    approved: boolean;
    toolName?: string;
    toolArguments?: string;
    reason?: string;
  }): Promise<{
    content?: string;
    responseId?: string;
    toolExecuted?: boolean;
    toolOutput?: string;
    pendingApproval?: {
      approvalRequestId: string;
      toolName: string;
      serverLabel?: string;
      arguments?: string;
    };
    handoff?: unknown;
  }>;

  getAuthToken?(): Promise<string>;
}

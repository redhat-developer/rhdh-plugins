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

import type { Entity } from '@backstage/catalog-model';
import type { JsonValue } from '@backstage/types';

/**
 * Model configuration for an inference provider.
 *
 * Uses a type alias (not an interface) so that TypeScript generates an
 * implicit index signature, keeping the type assignable to JsonObject
 * (required by Entity.spec) without an explicit open index signature.
 * This matches the closed JSON schema (`additionalProperties: false`).
 *
 * @public
 */
export type AgentRhdhChatModelConfig = {
  /** Sampling temperature. */
  temperature?: number;
  /** Maximum number of tokens to generate. */
  maxTokens?: number;
};

/**
 * Inference provider configuration for an agent-rhdh-chat entity.
 *
 * Uses a type alias (not an interface) so that TypeScript generates an
 * implicit index signature, keeping the type assignable to JsonObject
 * (required by Entity.spec) without an explicit open index signature.
 * This matches the closed JSON schema (`additionalProperties: false`).
 *
 * @public
 */
export type AgentRhdhChatInferenceProvider = {
  /** The inference provider identifier. */
  name: string;
  /** The model identifier. */
  model: string;
  /** Optional model configuration. */
  modelConfig?: AgentRhdhChatModelConfig;
};

/**
 * AiResource entity with spec.type 'agent-rhdh-chat'. Represents an
 * RHDH agentic chat agent with a focused configuration contract
 * and optional LLM model settings inside inferenceProvider.
 *
 * Follows the upstream discriminated-union pattern from
 * {@link @backstage/catalog-model#AiResourceEntityV1alpha1}.
 *
 * @public
 */
export interface AgentRhdhChatAiResourceEntityV1alpha1 extends Entity {
  apiVersion: 'backstage.io/v1alpha1';
  kind: 'AiResource';
  spec: {
    /** Must be 'agent-rhdh-chat'. */
    type: 'agent-rhdh-chat';
    /** An entity reference to the owner of the AI resource. */
    owner: string;
    /**
     * The agent's instructions (system prompt). Optional — omit when the
     * agent image/runtime already provides a default prompt.
     */
    instructions?: string;
    /** Optional inference provider with model configuration. */
    inferenceProvider?: AgentRhdhChatInferenceProvider;
    /** Opaque string references to tools available to this agent. */
    tools?: string[];
    /** JSON Schema object or simple type name describing the agent's output format. */
    outputSchema?: Record<string, JsonValue | undefined> | string;
    /**
     * Execution mode — declares how this agent is executed by LCore.
     *
     * - `in-process`  — runs inside the LCore process (no isolation).
     * - `subprocess`  — runs in a child process managed by LCore.
     * - `sandbox`     — runs in an administrator-predefined sandbox profile.
     * - Omitted       — stays unset; LCore applies its default.
     */
    executionMode?: 'in-process' | 'subprocess' | 'sandbox';
  };
}

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
 * Model settings for an agent AiResource entity.
 *
 * Uses a type alias (not an interface) so that TypeScript generates an
 * implicit index signature, keeping the type assignable to JsonObject
 * (required by Entity.spec) without an explicit open index signature.
 * This matches the closed JSON schema (`additionalProperties: false`).
 *
 * @public
 */
export type AgentAiResourceModelSettings = {
  /** Sampling temperature. */
  temperature?: number;
  /** Maximum number of tokens to generate. */
  maxTokens?: number;
  /** Tool choice strategy — a string preset or a structured object. */
  toolChoice?: string | Record<string, JsonValue | undefined>;
};

/**
 * AiResource entity with spec.type 'agent'. Represents an autonomous
 * or semi-autonomous AI agent with instructions and optional tool/handoff
 * configuration.
 *
 * Follows the upstream skill/rule discriminated-union pattern from
 * {@link @backstage/catalog-model#AiResourceEntityV1alpha1}.
 *
 * @public
 */
export interface AgentAiResourceEntityV1alpha1 extends Entity {
  apiVersion: 'backstage.io/v1alpha1';
  kind: 'AiResource';
  spec: {
    /** Must be 'agent'. */
    type: 'agent';
    /** The lifecycle state of the AI resource. */
    lifecycle: string;
    /** An entity reference to the owner of the AI resource. */
    owner: string;
    /** An entity reference to the system that the AI resource belongs to. */
    system?: string;
    /**
     * The agent's instructions (system prompt). Optional — omit when the
     * agent image/runtime already provides a default prompt.
     */
    instructions?: string;
    /** A description used when this agent is listed as a handoff target. */
    handoffDescription?: string;
    /** The model identifier for this agent. */
    model?: string;
    /** Opaque string references to other agents this agent can hand off to. */
    handoffs?: string[];
    /** Opaque string references to tools available to this agent. */
    tools?: string[];
    /** Controls tool use behavior. A string preset or an array of tool names. */
    toolUseBehavior?: string | string[];
    /** Whether to reset tool choice after each tool use. */
    resetToolChoice?: boolean;
    /** Model configuration settings. */
    modelSettings?: AgentAiResourceModelSettings;
    /** JSON Schema object or simple type name describing the agent's output format. */
    outputSchema?: Record<string, JsonValue | undefined> | string;
  };
}

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
import type {
  AgentExecutionInput,
  RunAgentRequest,
} from '@red-hat-developer-hub/backstage-plugin-agentic-chat-common';
import {
  agentRhdhChatAiResourceEntityV1alpha1Validator,
  isAgentRhdhChatAiResourceEntity,
} from '@red-hat-developer-hub/backstage-plugin-catalog-model-ai-resource-agent-rhdh-chat';
import {
  InvalidAgentConfigurationError,
  InvalidAgentKindError,
} from './errors';

const spawnModes = {
  'in-process': 'none',
  subprocess: 'local',
  sandbox: 'ephemeral',
} as const;

export async function agentToExecutionInput(
  entity: Entity,
  input: RunAgentRequest,
): Promise<AgentExecutionInput> {
  if (entity.kind.toLocaleLowerCase('en-US') !== 'airesource') {
    throw new InvalidAgentKindError();
  }
  if (!isAgentRhdhChatAiResourceEntity(entity)) {
    throw new InvalidAgentConfigurationError();
  }
  const valid = await agentRhdhChatAiResourceEntityV1alpha1Validator
    .check(entity)
    .catch(() => false);
  if (!valid) throw new InvalidAgentConfigurationError();

  const { spec } = entity;
  // Catalog also accepts string schemas. LCore requires an object here.
  if (typeof spec.outputSchema === 'string') {
    throw new InvalidAgentConfigurationError();
  }
  const defaultProvider = spec.inferenceProvider;
  const modelConfig =
    defaultProvider?.name === input.provider &&
    defaultProvider.model === input.model
      ? defaultProvider.modelConfig
      : undefined;

  return {
    agent: entity.metadata.name,
    prompt: input.query,
    ...(spec.executionMode !== undefined && {
      spawn: spawnModes[spec.executionMode],
    }),
    ...(spec.instructions !== undefined && { instructions: spec.instructions }),
    inference_provider: {
      name: input.provider,
      model: input.model,
      ...(modelConfig !== undefined && { modelConfig }),
    },
    ...(spec.tools !== undefined && { tools: spec.tools }),
    ...(spec.outputSchema !== undefined && {
      output_schema: spec.outputSchema,
    }),
    ...(input.conversation_id !== undefined && {
      conversation_id: input.conversation_id,
    }),
  };
}

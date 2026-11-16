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
import { InputError } from '@backstage/errors';
import type {
  AgentExecutionInput,
  RunAgentRequest,
} from '@red-hat-developer-hub/backstage-plugin-agentic-chat-common';
import { z } from 'zod';

const agentSpecSchema = z.object({
  type: z
    .string()
    .transform(value => value.toLocaleLowerCase('en-US'))
    .pipe(z.literal('agent')),
  executionMode: z.enum(['in-process', 'subprocess', 'sandbox']).optional(),
  instructions: z.string().optional(),
  tools: z.array(z.string().min(1)).optional(),
  outputSchema: z.record(z.string(), z.unknown()).optional(),
  handoffs: z.array(z.string()).optional(),
});

const spawnModes = {
  'in-process': 'none',
  subprocess: 'local',
  sandbox: 'ephemeral',
} as const;

export function agentToExecutionInput(
  entity: Entity,
  input: RunAgentRequest,
): AgentExecutionInput {
  if (entity.kind.toLocaleLowerCase('en-US') !== 'airesource') {
    throw new InputError('Expected an AiResource agent');
  }
  const parsed = agentSpecSchema.safeParse(entity.spec);
  if (!parsed.success) throw new InputError('Invalid agent configuration');
  const spec = parsed.data;
  if (spec.handoffs?.length) throw new InputError('Handoffs are not supported');

  return {
    agent: entity.metadata.name,
    prompt: input.query,
    ...(spec.executionMode !== undefined && {
      spawn: spawnModes[spec.executionMode],
    }),
    ...(spec.instructions !== undefined && { instructions: spec.instructions }),
    inference_provider: { name: input.provider, model: input.model },
    ...(spec.tools !== undefined && { tools: spec.tools }),
    ...(spec.outputSchema !== undefined && {
      output_schema: spec.outputSchema,
    }),
    ...(input.conversation_id !== undefined && {
      session_id: input.conversation_id,
    }),
  };
}

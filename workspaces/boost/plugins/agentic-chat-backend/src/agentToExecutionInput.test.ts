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
import { agentToExecutionInput } from './agentToExecutionInput';
import {
  InvalidAgentConfigurationError,
  InvalidAgentKindError,
} from './errors';

const input = (query: string) => ({
  query,
  agentRef: 'airesource:default/support-agent',
  provider: 'openai',
  model: 'selected-model',
});

const agent: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: { name: 'support-agent' },
  spec: {
    type: 'agent-rhdh-chat',
    lifecycle: 'production',
    owner: 'group:default/platform',
    instructions: 'Help the user',
    model: 'granite',
    tools: ['search'],
    outputSchema: {
      type: 'object',
      properties: { answer: { type: 'string' } },
    },
  },
};

it('interprets Catalog agent fields without constructing a workflow', async () => {
  expect(await agentToExecutionInput(agent, input('What failed?'))).toEqual({
    agent: 'support-agent',
    prompt: 'What failed?',
    instructions: 'Help the user',
    tools: ['search'],
    inference_provider: { name: 'openai', model: 'selected-model' },
    output_schema: {
      type: 'object',
      properties: { answer: { type: 'string' } },
    },
  });
});

it.each([
  ['in-process', 'none'],
  ['subprocess', 'local'],
  ['sandbox', 'ephemeral'],
])('maps %s to spawn %s', async (mode, spawn) => {
  const interpreted = await agentToExecutionInput(
    { ...agent, spec: { ...agent.spec, executionMode: mode } },
    input('Hello'),
  );
  expect(interpreted.spawn).toBe(spawn);
});

it('leaves omitted execution mode and optional capabilities absent', async () => {
  const minimal = {
    ...agent,
    spec: { type: 'agent-rhdh-chat', lifecycle: 'production', owner: 'team' },
  };
  const step = await agentToExecutionInput(minimal, input('Hello'));
  expect(JSON.parse(JSON.stringify(step))).toEqual({
    agent: 'support-agent',
    prompt: 'Hello',
    inference_provider: { name: 'openai', model: 'selected-model' },
  });
});

it.each(['invalid', false, null])(
  'rejects invalid execution mode %s',
  async mode => {
    await expect(
      agentToExecutionInput(
        { ...agent, spec: { ...agent.spec, executionMode: mode } },
        input('Hello'),
      ),
    ).rejects.toThrow(InvalidAgentConfigurationError);
  },
);

it('rejects non-agent entities', async () => {
  await expect(
    agentToExecutionInput({ ...agent, kind: 'Component' }, input('Hello')),
  ).rejects.toThrow(InvalidAgentKindError);
});

it('rejects unsupported string output schemas', async () => {
  await expect(
    agentToExecutionInput(
      { ...agent, spec: { ...agent.spec, outputSchema: 'CustomType' } },
      input('Hello'),
    ),
  ).rejects.toThrow(InvalidAgentConfigurationError);
});

describe('Catalog modelConfig', () => {
  const entity = {
    ...agent,
    spec: {
      ...agent.spec,
      inferenceProvider: {
        name: 'openai',
        model: 'selected-model',
        modelConfig: { temperature: 0, maxTokens: 512 },
      },
    },
  };

  it('preserves settings including zero for the default provider and model', async () => {
    const interpreted = await agentToExecutionInput(entity, input('Hello'));
    expect(interpreted.inference_provider).toEqual({
      name: 'openai',
      model: 'selected-model',
      modelConfig: { temperature: 0, maxTokens: 512 },
    });
  });

  it.each([
    { provider: 'openai', model: 'different-model' },
    { provider: 'different-provider', model: 'selected-model' },
  ])('omits settings for a different selection %j', async selection => {
    const interpreted = await agentToExecutionInput(entity, {
      ...input('Hello'),
      ...selection,
    });
    expect(interpreted.inference_provider).toEqual({
      name: selection.provider,
      model: selection.model,
    });
  });
});

it('maps conversation identity without a workflow envelope', async () => {
  const interpreted = await agentToExecutionInput(agent, {
    ...input('Hello'),
    conversation_id: 'session-1',
  });
  expect(interpreted.conversation_id).toBe('session-1');
});

it('does not rename conversation_id to a workflow session_id', async () => {
  const interpreted = await agentToExecutionInput(agent, {
    ...input('Hello'),
    conversation_id: 'conversation-1',
  });
  expect(interpreted.conversation_id).toBe('conversation-1');
  expect(interpreted).not.toHaveProperty('session_id');
});

it('rejects the legacy agent type for agentic chat', async () => {
  await expect(
    agentToExecutionInput(
      { ...agent, spec: { ...agent.spec, type: 'agent' } },
      input('Hello'),
    ),
  ).rejects.toThrow(InvalidAgentConfigurationError);
});

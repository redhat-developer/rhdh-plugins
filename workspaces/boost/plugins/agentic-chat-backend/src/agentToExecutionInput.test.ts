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
    type: 'agent',
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

it('interprets Catalog agent fields without constructing a workflow', () => {
  expect(agentToExecutionInput(agent, input('What failed?'))).toEqual({
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
])('maps %s to spawn %s', (mode, spawn) => {
  expect(
    agentToExecutionInput(
      { ...agent, spec: { ...agent.spec, executionMode: mode } },
      input('Hello'),
    ).spawn,
  ).toBe(spawn);
});

it('leaves omitted execution mode and optional capabilities absent', () => {
  const minimal = {
    ...agent,
    spec: { type: 'agent', lifecycle: 'production', owner: 'team' },
  };
  const step = agentToExecutionInput(minimal, input('Hello'));
  expect(JSON.parse(JSON.stringify(step))).toEqual({
    agent: 'support-agent',
    prompt: 'Hello',
    inference_provider: { name: 'openai', model: 'selected-model' },
  });
});

it.each(['invalid', false, null])('rejects invalid execution mode %s', mode => {
  expect(() =>
    agentToExecutionInput(
      { ...agent, spec: { ...agent.spec, executionMode: mode } },
      input('Hello'),
    ),
  ).toThrow('Invalid agent configuration');
});

it.each([
  { handoffs: ['other-agent'] },
  { handoffs: [] },
  { handoffs: null },
  { handoffs: 'unused-handoff-data' },
])(
  'ignores Catalog handoffs without changing interpreted input: %j',
  ({ handoffs }) => {
    const interpreted = agentToExecutionInput(
      { ...agent, spec: { ...agent.spec, handoffs } },
      input('Hello'),
    );
    expect(interpreted).toEqual(agentToExecutionInput(agent, input('Hello')));
    expect(interpreted).not.toHaveProperty('handoffs');
  },
);

it('rejects non-agent entities and unsupported string output schemas', () => {
  expect(() =>
    agentToExecutionInput({ ...agent, kind: 'Component' }, input('Hello')),
  ).toThrow('Expected an AiResource agent');
  expect(() =>
    agentToExecutionInput(
      { ...agent, spec: { ...agent.spec, outputSchema: 'CustomType' } },
      input('Hello'),
    ),
  ).toThrow('Invalid agent configuration');
});

it('uses frontend selection without interpreting the Catalog model', () => {
  const entity = {
    ...agent,
    spec: {
      ...agent.spec,
      model: { provider: 'catalog', name: 'catalog-model' },
    },
  };
  expect(
    agentToExecutionInput(entity, input('Hello')).inference_provider,
  ).toEqual({ name: 'openai', model: 'selected-model' });
});

it('maps conversation identity without a workflow envelope', () => {
  expect(
    agentToExecutionInput(agent, {
      ...input('Hello'),
      conversation_id: 'session-1',
    }).conversation_id,
  ).toBe('session-1');
});

it('does not rename conversation_id to a workflow session_id', () => {
  const interpreted = agentToExecutionInput(agent, {
    ...input('Hello'),
    conversation_id: 'conversation-1',
  });
  expect(interpreted.conversation_id).toBe('conversation-1');
  expect(interpreted).not.toHaveProperty('session_id');
});

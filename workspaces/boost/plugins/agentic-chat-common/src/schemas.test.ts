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

import { runAgentRequestSchema } from './schemas';

const selection = {
  agentRef: 'airesource:default/support',
  provider: 'openai',
  model: 'selected-model',
};

it('accepts frontend provider and model alongside the query', () => {
  const input = { query: 'Hello', ...selection };
  expect(runAgentRequestSchema.parse(input)).toEqual(input);
});

it.each([
  {},
  { provider: 'openai' },
  { model: 'selected-model' },
  { provider: '', model: 'selected-model' },
  { provider: '  ', model: 'selected-model' },
  { provider: 'openai', model: '' },
  { provider: 'openai', model: '  ' },
  { provider: { name: 'openai' }, model: 'selected-model' },
  { provider: 'openai', model: 42 },
])('rejects missing or invalid model selection %j', fields => {
  expect(
    runAgentRequestSchema.safeParse({
      query: 'Hello',
      agentRef: selection.agentRef,
      ...fields,
    }).success,
  ).toBe(false);
});

it('rejects caller-supplied identity, credentials and capability overrides', () => {
  for (const field of [
    'user_id',
    'snapshot',
    'definition',
    'executionMode',
    'instructions',
    'tools',
    'credentials_secret',
  ]) {
    expect(
      runAgentRequestSchema.safeParse({
        query: 'Hello',
        ...selection,
        [field]: 'override',
      }).success,
    ).toBe(false);
  }
});

it('rejects empty and whitespace-only queries', () => {
  for (const query of ['', '  ']) {
    expect(
      runAgentRequestSchema.safeParse({ query, ...selection }).success,
    ).toBe(false);
  }
});

it.each([undefined, null, '', '  ', 42, {}])(
  'rejects missing or invalid agentRef %j',
  agentRef => {
    expect(
      runAgentRequestSchema.safeParse({
        query: 'Hello',
        ...selection,
        agentRef,
      }).success,
    ).toBe(false);
  },
);

it('rejects the obsolete snake_case agent_ref selector', () => {
  expect(
    runAgentRequestSchema.safeParse({
      query: 'Hello',
      ...selection,
      agent_ref: selection.agentRef,
    }).success,
  ).toBe(false);
});

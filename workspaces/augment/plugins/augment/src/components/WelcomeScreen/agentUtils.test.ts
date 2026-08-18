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

import {
  sortAgents,
  isAgentReady,
  getAgentAvatarColor,
  readJsonArray,
  writeJsonArray,
  PINNED_KEY,
  RECENT_KEY,
  MAX_RECENT,
  STATUS_COLORS,
} from './agentUtils';
import type { AgentWithCard } from './agentUtils';

function makeAgent(overrides: Partial<AgentWithCard>): AgentWithCard {
  return {
    name: 'agent-default',
    namespace: 'ns',
    description: '',
    status: 'Running',
    labels: {},
    ...overrides,
  };
}

describe('sortAgents', () => {
  const agents: AgentWithCard[] = [
    makeAgent({
      name: 'charlie',
      status: 'Running',
      createdAt: '2024-01-03T00:00:00Z',
    }),
    makeAgent({
      name: 'alpha',
      status: 'Failed',
      createdAt: '2024-01-01T00:00:00Z',
    }),
    makeAgent({
      name: 'bravo',
      status: 'Pending',
      createdAt: '2024-01-02T00:00:00Z',
    }),
  ];

  it('sorts by name alphabetically', () => {
    const result = sortAgents(agents, 'name');
    expect(result.map(a => a.name)).toEqual(['alpha', 'bravo', 'charlie']);
  });

  it('sorts by status priority (ready first)', () => {
    const result = sortAgents(agents, 'status');
    expect(result.map(a => a.name)).toEqual(['charlie', 'bravo', 'alpha']);
  });

  it('sorts by newest (most recent first)', () => {
    const result = sortAgents(agents, 'newest');
    expect(result.map(a => a.name)).toEqual(['charlie', 'bravo', 'alpha']);
  });

  it('uses agentCard.name when available for name sort', () => {
    const withCard: AgentWithCard[] = [
      makeAgent({
        name: 'z-internal',
        agentCard: { name: 'Alpha Bot', version: '1', url: '' } as any,
      }),
      makeAgent({
        name: 'a-internal',
        agentCard: { name: 'Zeta Bot', version: '1', url: '' } as any,
      }),
    ];
    const result = sortAgents(withCard, 'name');
    expect(result[0].agentCard?.name).toBe('Alpha Bot');
  });

  it('does not mutate original array', () => {
    const original = [...agents];
    sortAgents(agents, 'name');
    expect(agents).toEqual(original);
  });
});

describe('isAgentReady', () => {
  it.each([
    ['Ready', true],
    ['Running', true],
    ['Active', true],
  ])('returns true for %s', (status, expected) => {
    expect(isAgentReady(status)).toBe(expected);
  });

  it.each([
    ['Pending', false],
    ['Failed', false],
    ['Error', false],
    ['Building', false],
    ['Unknown', false],
  ])('returns false for %s', (status, expected) => {
    expect(isAgentReady(status)).toBe(expected);
  });
});

describe('getAgentAvatarColor', () => {
  it('returns a valid HSL color string', () => {
    const color = getAgentAvatarColor('my-agent');
    expect(color).toMatch(/^hsl\(\d+, 55%, 50%\)$/);
  });

  it('returns consistent color for same name', () => {
    const a = getAgentAvatarColor('test-agent');
    const b = getAgentAvatarColor('test-agent');
    expect(a).toBe(b);
  });

  it('returns different colors for different names', () => {
    const a = getAgentAvatarColor('agent-alpha');
    const b = getAgentAvatarColor('agent-zeta');
    expect(a).not.toBe(b);
  });
});

describe('readJsonArray / writeJsonArray', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty array when key is absent', () => {
    expect(readJsonArray('nonexistent')).toEqual([]);
  });

  it('round-trips an array through localStorage', () => {
    writeJsonArray('test-key', ['a', 'b', 'c']);
    expect(readJsonArray('test-key')).toEqual(['a', 'b', 'c']);
  });

  it('returns empty array for corrupted JSON', () => {
    localStorage.setItem('bad', '{invalid');
    expect(readJsonArray('bad')).toEqual([]);
  });
});

describe('constants', () => {
  it('PINNED_KEY is defined', () => {
    expect(PINNED_KEY).toBe('augment:pinned-agents');
  });

  it('RECENT_KEY is defined', () => {
    expect(RECENT_KEY).toBe('augment:recent-agents');
  });

  it('MAX_RECENT is 5', () => {
    expect(MAX_RECENT).toBe(5);
  });

  it('STATUS_COLORS maps known statuses', () => {
    expect(STATUS_COLORS.Running).toBe('success');
    expect(STATUS_COLORS.Pending).toBe('warning');
    expect(STATUS_COLORS.Failed).toBe('error');
  });
});

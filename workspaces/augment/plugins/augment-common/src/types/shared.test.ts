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
  normalizeLifecycleStage,
  isValidTransition,
  getAvailableTransitions,
  deriveRoleFromTopology,
} from './shared';

describe('normalizeLifecycleStage', () => {
  it('returns draft for undefined', () => {
    expect(normalizeLifecycleStage(undefined)).toBe('draft');
  });

  it('returns draft for empty string', () => {
    expect(normalizeLifecycleStage('')).toBe('draft');
    expect(normalizeLifecycleStage('   ')).toBe('draft');
  });

  it('normalizes valid stages to lowercase', () => {
    expect(normalizeLifecycleStage('Published')).toBe('published');
    expect(normalizeLifecycleStage('PENDING')).toBe('pending');
    expect(normalizeLifecycleStage('archived')).toBe('archived');
  });

  it('returns trimmed value for padded input (Finding C fix)', () => {
    const result = normalizeLifecycleStage(' Published ');
    expect(result).toBe('published');
    expect(result).not.toContain(' ');
  });

  it('maps legacy stage names', () => {
    expect(normalizeLifecycleStage('registered')).toBe('pending');
    expect(normalizeLifecycleStage('deployed')).toBe('published');
    expect(normalizeLifecycleStage('Registered')).toBe('pending');
    expect(normalizeLifecycleStage('review')).toBe('pending');
    expect(normalizeLifecycleStage('staging')).toBe('pending');
    expect(normalizeLifecycleStage('production')).toBe('published');
    expect(normalizeLifecycleStage('retired')).toBe('archived');
  });

  it('returns draft for unknown stage names', () => {
    expect(normalizeLifecycleStage('unknown')).toBe('draft');
    expect(normalizeLifecycleStage('active')).toBe('draft');
  });
});

describe('isValidTransition', () => {
  it('allows draft -> pending', () => {
    expect(isValidTransition('draft', 'pending')).toBe(true);
  });

  it('allows pending -> published', () => {
    expect(isValidTransition('pending', 'published')).toBe(true);
  });

  it('allows pending -> draft (reject)', () => {
    expect(isValidTransition('pending', 'draft')).toBe(true);
  });

  it('allows published -> pending (unpublish)', () => {
    expect(isValidTransition('published', 'pending')).toBe(true);
  });

  it('allows published -> archived', () => {
    expect(isValidTransition('published', 'archived')).toBe(true);
  });

  it('allows archived -> draft (reactivate)', () => {
    expect(isValidTransition('archived', 'draft')).toBe(true);
  });

  it('rejects invalid transitions', () => {
    expect(isValidTransition('draft', 'published')).toBe(false);
    expect(isValidTransition('draft', 'archived')).toBe(false);
    expect(isValidTransition('archived', 'published')).toBe(false);
    expect(isValidTransition('published', 'draft')).toBe(false);
  });
});

describe('getAvailableTransitions', () => {
  it('returns submit for draft', () => {
    const transitions = getAvailableTransitions('draft');
    expect(transitions).toHaveLength(1);
    expect(transitions[0].action).toBe('submit');
  });

  it('returns approve, reject, and withdraw for pending', () => {
    const transitions = getAvailableTransitions('pending');
    expect(transitions).toHaveLength(3);
    expect(transitions.map(t => t.action)).toEqual(
      expect.arrayContaining(['approve', 'reject', 'withdraw']),
    );
  });

  it('returns request-unpublish and archive for published', () => {
    const transitions = getAvailableTransitions('published');
    expect(transitions).toHaveLength(2);
    expect(transitions.map(t => t.action)).toEqual(
      expect.arrayContaining(['request-unpublish', 'archive']),
    );
  });

  it('returns reactivate for archived', () => {
    const transitions = getAvailableTransitions('archived');
    expect(transitions).toHaveLength(1);
    expect(transitions[0].action).toBe('reactivate');
  });
});

describe('deriveRoleFromTopology', () => {
  it('returns standalone for agent with no connections', () => {
    expect(deriveRoleFromTopology('agent-a', { 'agent-a': {} })).toBe(
      'standalone',
    );
  });

  it('returns router for agent with outgoing handoffs', () => {
    expect(
      deriveRoleFromTopology('router', {
        router: { handoffs: ['specialist'] },
        specialist: {},
      }),
    ).toBe('router');
  });

  it('returns specialist for agent targeted by another', () => {
    expect(
      deriveRoleFromTopology('specialist', {
        router: { handoffs: ['specialist'] },
        specialist: {},
      }),
    ).toBe('specialist');
  });

  it('returns standalone for null agent entry', () => {
    expect(deriveRoleFromTopology('missing', { missing: null })).toBe(
      'standalone',
    );
  });
});

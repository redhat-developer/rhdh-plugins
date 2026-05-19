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
    expect(normalizeLifecycleStage('Production')).toBe('production');
    expect(normalizeLifecycleStage('REVIEW')).toBe('review');
    expect(normalizeLifecycleStage('staging')).toBe('staging');
  });

  it('returns trimmed value for padded input (Finding C fix)', () => {
    const result = normalizeLifecycleStage(' Production ');
    expect(result).toBe('production');
    expect(result).not.toContain(' ');
  });

  it('maps legacy stage names', () => {
    expect(normalizeLifecycleStage('registered')).toBe('review');
    expect(normalizeLifecycleStage('deployed')).toBe('production');
    expect(normalizeLifecycleStage('Registered')).toBe('review');
  });

  it('returns draft for unknown stage names', () => {
    expect(normalizeLifecycleStage('unknown')).toBe('draft');
    expect(normalizeLifecycleStage('active')).toBe('draft');
  });
});

describe('isValidTransition', () => {
  it('allows draft -> review', () => {
    expect(isValidTransition('draft', 'review')).toBe(true);
  });

  it('allows review -> staging', () => {
    expect(isValidTransition('review', 'staging')).toBe(true);
  });

  it('allows staging -> production', () => {
    expect(isValidTransition('staging', 'production')).toBe(true);
  });

  it('allows production -> retired', () => {
    expect(isValidTransition('production', 'retired')).toBe(true);
  });

  it('allows rollback: review -> draft', () => {
    expect(isValidTransition('review', 'draft')).toBe(true);
  });

  it('allows rollback: staging -> draft', () => {
    expect(isValidTransition('staging', 'draft')).toBe(true);
  });

  it('allows rollback: production -> staging', () => {
    expect(isValidTransition('production', 'staging')).toBe(true);
  });

  it('allows reactivate: retired -> draft', () => {
    expect(isValidTransition('retired', 'draft')).toBe(true);
  });

  it('rejects invalid transitions', () => {
    expect(isValidTransition('draft', 'production')).toBe(false);
    expect(isValidTransition('draft', 'staging')).toBe(false);
    expect(isValidTransition('retired', 'production')).toBe(false);
    expect(isValidTransition('production', 'draft')).toBe(false);
  });
});

describe('getAvailableTransitions', () => {
  it('returns submit for draft', () => {
    const transitions = getAvailableTransitions('draft');
    expect(transitions).toHaveLength(1);
    expect(transitions[0].action).toBe('submit');
  });

  it('returns approve and reject for review', () => {
    const transitions = getAvailableTransitions('review');
    expect(transitions).toHaveLength(2);
    expect(transitions.map(t => t.action)).toEqual(
      expect.arrayContaining(['approve', 'reject']),
    );
  });

  it('returns promote and rollback for staging', () => {
    const transitions = getAvailableTransitions('staging');
    expect(transitions).toHaveLength(2);
    expect(transitions.map(t => t.action)).toEqual(
      expect.arrayContaining(['promote', 'rollback']),
    );
  });

  it('returns rollback and retire for production', () => {
    const transitions = getAvailableTransitions('production');
    expect(transitions).toHaveLength(2);
    expect(transitions.map(t => t.action)).toEqual(
      expect.arrayContaining(['rollback', 'retire']),
    );
  });

  it('returns reactivate for retired', () => {
    const transitions = getAvailableTransitions('retired');
    expect(transitions).toHaveLength(1);
    expect(transitions[0].action).toBe('reactivate');
  });
});

describe('deriveRoleFromTopology', () => {
  it('returns standalone for agent with no connections', () => {
    expect(
      deriveRoleFromTopology('agent-a', { 'agent-a': {} }),
    ).toBe('standalone');
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

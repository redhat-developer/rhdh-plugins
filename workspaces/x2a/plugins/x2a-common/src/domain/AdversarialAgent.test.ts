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

import { AdversarialAgentEntity } from './AdversarialAgent';

const VALID_PROMPT =
  'Review the migration output for security vulnerabilities, privilege escalation, and correctness issues in the generated Ansible playbooks.';

const makeEntity = (overrides: Partial<AdversarialAgentEntity> = {}) => {
  const now = new Date('2025-01-01T00:00:00Z');
  return new AdversarialAgentEntity(
    overrides.id ?? 'aaaaaaaa-0000-0000-0000-000000000001',
    overrides.name ?? 'Security Checker',
    overrides.prompt ?? VALID_PROMPT,
    overrides.phases ?? ['analyze'],
    overrides.critical ?? false,
    overrides.createdBy ?? 'user:default/admin',
    overrides.createdAt ?? now,
    overrides.updatedAt ?? now,
  );
};

describe('AdversarialAgentEntity', () => {
  describe('constructor – validation', () => {
    it('constructs with valid inputs', () => {
      const entity = makeEntity();
      expect(entity.name).toBe('Security Checker');
      expect(entity.phases).toEqual(['analyze']);
      expect(entity.critical).toBe(false);
    });

    it('throws when name is too short', () => {
      expect(() => makeEntity({ name: 'ab' })).toThrow(
        'Agent name must be between 3 and 100 characters',
      );
    });

    it('throws when name is too long', () => {
      expect(() => makeEntity({ name: 'a'.repeat(101) })).toThrow(
        'Agent name must be between 3 and 100 characters',
      );
    });

    it('throws when prompt is too short', () => {
      expect(() => makeEntity({ prompt: 'too short' })).toThrow(
        'Agent prompt must be between 50 and 5000 characters',
      );
    });

    it('throws when prompt is too long', () => {
      expect(() => makeEntity({ prompt: 'a'.repeat(5001) })).toThrow(
        'Agent prompt must be between 50 and 5000 characters',
      );
    });

    it('throws when phases is empty', () => {
      expect(() => makeEntity({ phases: [] })).toThrow(
        'Agent must have at least one phase',
      );
    });

    it('throws for a phase that is not analyze or migrate', () => {
      expect(() => makeEntity({ phases: ['init'] })).toThrow(
        'Invalid phase: "init". Valid phases: analyze, migrate',
      );
    });

    it('throws for an adversarial phase value', () => {
      expect(() => makeEntity({ phases: ['adversarial-analyze'] })).toThrow(
        'Invalid phase: "adversarial-analyze". Valid phases: analyze, migrate',
      );
    });

    it('accepts both analyze and migrate together', () => {
      const entity = makeEntity({ phases: ['analyze', 'migrate'] });
      expect(entity.phases).toEqual(['analyze', 'migrate']);
    });

    it('throws when createdBy is empty', () => {
      expect(() => makeEntity({ createdBy: '' })).toThrow(
        'Agent created_by must be a non-empty string',
      );
    });
  });

  describe('fromRow', () => {
    it('constructs from a database row', () => {
      const now = new Date('2025-06-01T12:00:00Z');
      const entity = AdversarialAgentEntity.fromRow({
        id: 'bbbbbbbb-0000-0000-0000-000000000002',
        name: 'Privilege Check',
        prompt: VALID_PROMPT,
        phases: ['migrate'],
        critical: 1,
        created_by: 'user:default/alice',
        created_at: now,
        updated_at: now,
      });
      expect(entity.id).toBe('bbbbbbbb-0000-0000-0000-000000000002');
      expect(entity.name).toBe('Privilege Check');
      expect(entity.phases).toEqual(['migrate']);
      expect(entity.critical).toBe(true);
      expect(entity.createdBy).toBe('user:default/alice');
    });

    it('defaults critical to false when null', () => {
      const now = new Date();
      const entity = AdversarialAgentEntity.fromRow({
        id: 'cccccccc-0000-0000-0000-000000000003',
        name: 'Non-critical Agent',
        prompt: VALID_PROMPT,
        phases: ['analyze'],
        critical: null,
        created_by: 'user:default/bob',
        created_at: now,
        updated_at: now,
      });
      expect(entity.critical).toBe(false);
    });
  });

  describe('toConfig', () => {
    it('returns a config with all required fields', () => {
      const entity = makeEntity({ critical: true });
      const snapshot = entity.toConfig();
      expect(snapshot).toEqual({
        id: entity.id,
        name: entity.name,
        prompt: entity.prompt,
        phases: entity.phases,
        critical: true,
      });
    });
  });

  describe('equals', () => {
    it('returns true for entities with the same fields', () => {
      const a = makeEntity();
      const b = makeEntity();
      expect(a.equals(b)).toBe(true);
    });

    it('returns false when name differs', () => {
      const a = makeEntity({ name: 'Agent A' });
      const b = makeEntity({ name: 'Agent B' });
      expect(a.equals(b)).toBe(false);
    });

    it('returns false when phases differ', () => {
      const a = makeEntity({ phases: ['analyze'] });
      const b = makeEntity({ phases: ['migrate'] });
      expect(a.equals(b)).toBe(false);
    });

    it('returns false when critical differs', () => {
      const a = makeEntity({ critical: true });
      const b = makeEntity({ critical: false });
      expect(a.equals(b)).toBe(false);
    });
  });

  describe('toString', () => {
    it('returns a readable representation', () => {
      const entity = makeEntity({
        id: 'dddddddd-0000-0000-0000-000000000004',
        name: 'My Agent',
      });
      expect(entity.toString()).toBe(
        'AdversarialAgentEntity(dddddddd-0000-0000-0000-000000000004: My Agent)',
      );
    });
  });
});

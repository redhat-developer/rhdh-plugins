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

import { Phase } from './Phase';

describe('Phase', () => {
  describe('from', () => {
    it('returns Phase.INIT for "init"', () => {
      expect(Phase.from('init')).toBe(Phase.INIT);
    });

    it('returns Phase.ANALYZE for "analyze"', () => {
      expect(Phase.from('analyze')).toBe(Phase.ANALYZE);
    });

    it('returns Phase.MIGRATE for "migrate"', () => {
      expect(Phase.from('migrate')).toBe(Phase.MIGRATE);
    });

    it('returns Phase.PUBLISH for "publish"', () => {
      expect(Phase.from('publish')).toBe(Phase.PUBLISH);
    });

    it('throws for an invalid phase', () => {
      expect(() => Phase.from('invalid')).toThrow(
        'Invalid migration phase: "invalid". Valid: init, analyze, migrate, publish',
      );
    });
  });

  describe('all', () => {
    it('returns 4 phases in ordinal order', () => {
      const all = Phase.all();
      expect(all).toHaveLength(4);
      expect(all).toEqual([
        Phase.INIT,
        Phase.ANALYZE,
        Phase.MIGRATE,
        Phase.PUBLISH,
      ]);
    });
  });

  describe('modulePhases', () => {
    it('returns 3 phases excluding init', () => {
      const modulePhases = Phase.modulePhases();
      expect(modulePhases).toHaveLength(3);
      expect(modulePhases).toEqual([
        Phase.ANALYZE,
        Phase.MIGRATE,
        Phase.PUBLISH,
      ]);
    });
  });

  describe('values', () => {
    it('returns raw string values for all phases', () => {
      expect(Phase.values()).toEqual(['init', 'analyze', 'migrate', 'publish']);
    });
  });

  describe('modulePhaseValues', () => {
    it('returns raw string values for module phases', () => {
      expect(Phase.modulePhaseValues()).toEqual([
        'analyze',
        'migrate',
        'publish',
      ]);
    });
  });

  describe('isProjectPhase / isModulePhase', () => {
    it('INIT is a project phase', () => {
      expect(Phase.INIT.isProjectPhase()).toBe(true);
      expect(Phase.INIT.isModulePhase()).toBe(false);
    });

    it('ANALYZE is a module phase', () => {
      expect(Phase.ANALYZE.isModulePhase()).toBe(true);
      expect(Phase.ANALYZE.isProjectPhase()).toBe(false);
    });

    it('MIGRATE is a module phase', () => {
      expect(Phase.MIGRATE.isModulePhase()).toBe(true);
      expect(Phase.MIGRATE.isProjectPhase()).toBe(false);
    });

    it('PUBLISH is a module phase', () => {
      expect(Phase.PUBLISH.isModulePhase()).toBe(true);
      expect(Phase.PUBLISH.isProjectPhase()).toBe(false);
    });
  });

  describe('ordinal', () => {
    it('assigns ordinals in order', () => {
      expect(Phase.INIT.ordinal).toBe(0);
      expect(Phase.ANALYZE.ordinal).toBe(1);
      expect(Phase.MIGRATE.ordinal).toBe(2);
      expect(Phase.PUBLISH.ordinal).toBe(3);
    });
  });

  describe('toString', () => {
    it('returns the raw string value', () => {
      expect(Phase.INIT.toString()).toBe('init');
      expect(Phase.ANALYZE.toString()).toBe('analyze');
      expect(Phase.MIGRATE.toString()).toBe('migrate');
      expect(Phase.PUBLISH.toString()).toBe('publish');
    });
  });

  describe('equals', () => {
    it('returns true for same instance', () => {
      expect(Phase.INIT.equals(Phase.INIT)).toBe(true);
    });

    it('returns true for Phase.from result', () => {
      expect(Phase.INIT.equals(Phase.from('init'))).toBe(true);
    });

    it('returns false for different phases', () => {
      expect(Phase.INIT.equals(Phase.ANALYZE)).toBe(false);
    });
  });
});

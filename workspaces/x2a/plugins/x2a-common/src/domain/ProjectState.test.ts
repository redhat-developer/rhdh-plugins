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

import { ProjectState } from './ProjectState';

describe('ProjectState', () => {
  describe('from', () => {
    it('returns ProjectState.CREATED for "created"', () => {
      expect(ProjectState.from('created')).toBe(ProjectState.CREATED);
    });

    it('returns ProjectState.INITIALIZING for "initializing"', () => {
      expect(ProjectState.from('initializing')).toBe(ProjectState.INITIALIZING);
    });

    it('returns ProjectState.INITIALIZED for "initialized"', () => {
      expect(ProjectState.from('initialized')).toBe(ProjectState.INITIALIZED);
    });

    it('returns ProjectState.IN_PROGRESS for "inProgress"', () => {
      expect(ProjectState.from('inProgress')).toBe(ProjectState.IN_PROGRESS);
    });

    it('returns ProjectState.FAILED for "failed"', () => {
      expect(ProjectState.from('failed')).toBe(ProjectState.FAILED);
    });

    it('returns ProjectState.COMPLETED for "completed"', () => {
      expect(ProjectState.from('completed')).toBe(ProjectState.COMPLETED);
    });

    it('throws for an invalid state', () => {
      expect(() => ProjectState.from('invalid')).toThrow(
        'Invalid project state: "invalid". Valid: created, initializing, initialized, inProgress, failed, completed',
      );
    });
  });

  describe('all', () => {
    it('returns 6 states in defined order', () => {
      const all = ProjectState.all();
      expect(all).toHaveLength(6);
      expect(all).toEqual([
        ProjectState.CREATED,
        ProjectState.INITIALIZING,
        ProjectState.INITIALIZED,
        ProjectState.IN_PROGRESS,
        ProjectState.FAILED,
        ProjectState.COMPLETED,
      ]);
    });
  });

  describe('values', () => {
    it('returns raw string values for all states', () => {
      expect(ProjectState.values()).toEqual([
        'created',
        'initializing',
        'initialized',
        'inProgress',
        'failed',
        'completed',
      ]);
    });
  });

  describe('individual predicates', () => {
    it('isCreated', () => {
      expect(ProjectState.CREATED.isCreated()).toBe(true);
      expect(ProjectState.INITIALIZING.isCreated()).toBe(false);
    });

    it('isInitializing', () => {
      expect(ProjectState.INITIALIZING.isInitializing()).toBe(true);
      expect(ProjectState.CREATED.isInitializing()).toBe(false);
    });

    it('isInitialized', () => {
      expect(ProjectState.INITIALIZED.isInitialized()).toBe(true);
      expect(ProjectState.CREATED.isInitialized()).toBe(false);
    });

    it('isInProgress', () => {
      expect(ProjectState.IN_PROGRESS.isInProgress()).toBe(true);
      expect(ProjectState.CREATED.isInProgress()).toBe(false);
    });

    it('isFailed', () => {
      expect(ProjectState.FAILED.isFailed()).toBe(true);
      expect(ProjectState.CREATED.isFailed()).toBe(false);
    });

    it('isComplete', () => {
      expect(ProjectState.COMPLETED.isComplete()).toBe(true);
      expect(ProjectState.CREATED.isComplete()).toBe(false);
    });
  });

  describe('ordinal', () => {
    it('assigns sequential ordinals from 0 to 5', () => {
      expect(ProjectState.CREATED.ordinal).toBe(0);
      expect(ProjectState.INITIALIZING.ordinal).toBe(1);
      expect(ProjectState.INITIALIZED.ordinal).toBe(2);
      expect(ProjectState.IN_PROGRESS.ordinal).toBe(3);
      expect(ProjectState.FAILED.ordinal).toBe(4);
      expect(ProjectState.COMPLETED.ordinal).toBe(5);
    });
  });

  describe('toString', () => {
    it('returns the raw string value', () => {
      expect(ProjectState.CREATED.toString()).toBe('created');
      expect(ProjectState.INITIALIZING.toString()).toBe('initializing');
      expect(ProjectState.INITIALIZED.toString()).toBe('initialized');
      expect(ProjectState.IN_PROGRESS.toString()).toBe('inProgress');
      expect(ProjectState.FAILED.toString()).toBe('failed');
      expect(ProjectState.COMPLETED.toString()).toBe('completed');
    });
  });

  describe('equals', () => {
    it('returns true for same instance', () => {
      expect(ProjectState.CREATED.equals(ProjectState.CREATED)).toBe(true);
    });

    it('returns true for ProjectState.from result (flyweight identity)', () => {
      expect(ProjectState.CREATED.equals(ProjectState.from('created'))).toBe(
        true,
      );
    });

    it('returns false for different states', () => {
      expect(ProjectState.CREATED.equals(ProjectState.FAILED)).toBe(false);
    });
  });

  describe('flyweight identity', () => {
    it('from() returns the exact same instance', () => {
      expect(ProjectState.from('created')).toBe(ProjectState.CREATED);
      expect(ProjectState.from('initializing')).toBe(ProjectState.INITIALIZING);
      expect(ProjectState.from('initialized')).toBe(ProjectState.INITIALIZED);
      expect(ProjectState.from('inProgress')).toBe(ProjectState.IN_PROGRESS);
      expect(ProjectState.from('failed')).toBe(ProjectState.FAILED);
      expect(ProjectState.from('completed')).toBe(ProjectState.COMPLETED);
    });
  });
});

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

import { JobStatus } from './JobStatus';

describe('JobStatus', () => {
  describe('from', () => {
    it('returns JobStatus.PENDING for "pending"', () => {
      expect(JobStatus.from('pending')).toBe(JobStatus.PENDING);
    });

    it('returns JobStatus.RUNNING for "running"', () => {
      expect(JobStatus.from('running')).toBe(JobStatus.RUNNING);
    });

    it('returns JobStatus.SUCCESS for "success"', () => {
      expect(JobStatus.from('success')).toBe(JobStatus.SUCCESS);
    });

    it('returns JobStatus.ERROR for "error"', () => {
      expect(JobStatus.from('error')).toBe(JobStatus.ERROR);
    });

    it('returns JobStatus.CANCELLED for "cancelled"', () => {
      expect(JobStatus.from('cancelled')).toBe(JobStatus.CANCELLED);
    });

    it('throws for an invalid status', () => {
      expect(() => JobStatus.from('invalid')).toThrow(
        'Invalid job status: "invalid". Valid: pending, running, success, error, cancelled',
      );
    });
  });

  describe('all', () => {
    it('returns 5 statuses in defined order', () => {
      const all = JobStatus.all();
      expect(all).toHaveLength(5);
      expect(all).toEqual([
        JobStatus.PENDING,
        JobStatus.RUNNING,
        JobStatus.SUCCESS,
        JobStatus.ERROR,
        JobStatus.CANCELLED,
      ]);
    });
  });

  describe('values', () => {
    it('returns raw string values for all statuses', () => {
      expect(JobStatus.values()).toEqual([
        'pending',
        'running',
        'success',
        'error',
        'cancelled',
      ]);
    });
  });

  describe('activeStatuses', () => {
    it('returns pending and running', () => {
      expect(JobStatus.activeStatuses()).toEqual([
        JobStatus.PENDING,
        JobStatus.RUNNING,
      ]);
    });
  });

  describe('finishedStatuses', () => {
    it('returns success, error, and cancelled', () => {
      expect(JobStatus.finishedStatuses()).toEqual([
        JobStatus.SUCCESS,
        JobStatus.ERROR,
        JobStatus.CANCELLED,
      ]);
    });
  });

  describe('isActive / isFinished', () => {
    it('PENDING is active', () => {
      expect(JobStatus.PENDING.isActive()).toBe(true);
      expect(JobStatus.PENDING.isFinished()).toBe(false);
    });

    it('RUNNING is active', () => {
      expect(JobStatus.RUNNING.isActive()).toBe(true);
      expect(JobStatus.RUNNING.isFinished()).toBe(false);
    });

    it('SUCCESS is finished', () => {
      expect(JobStatus.SUCCESS.isFinished()).toBe(true);
      expect(JobStatus.SUCCESS.isActive()).toBe(false);
    });

    it('ERROR is finished', () => {
      expect(JobStatus.ERROR.isFinished()).toBe(true);
      expect(JobStatus.ERROR.isActive()).toBe(false);
    });

    it('CANCELLED is finished', () => {
      expect(JobStatus.CANCELLED.isFinished()).toBe(true);
      expect(JobStatus.CANCELLED.isActive()).toBe(false);
    });
  });

  describe('individual predicates', () => {
    it('isPending', () => {
      expect(JobStatus.PENDING.isPending()).toBe(true);
      expect(JobStatus.RUNNING.isPending()).toBe(false);
    });

    it('isRunning', () => {
      expect(JobStatus.RUNNING.isRunning()).toBe(true);
      expect(JobStatus.PENDING.isRunning()).toBe(false);
    });

    it('isSuccess', () => {
      expect(JobStatus.SUCCESS.isSuccess()).toBe(true);
      expect(JobStatus.ERROR.isSuccess()).toBe(false);
    });

    it('isError', () => {
      expect(JobStatus.ERROR.isError()).toBe(true);
      expect(JobStatus.SUCCESS.isError()).toBe(false);
    });

    it('isCancelled', () => {
      expect(JobStatus.CANCELLED.isCancelled()).toBe(true);
      expect(JobStatus.PENDING.isCancelled()).toBe(false);
    });
  });

  describe('toString', () => {
    it('returns the raw string value', () => {
      expect(JobStatus.PENDING.toString()).toBe('pending');
      expect(JobStatus.RUNNING.toString()).toBe('running');
      expect(JobStatus.SUCCESS.toString()).toBe('success');
      expect(JobStatus.ERROR.toString()).toBe('error');
      expect(JobStatus.CANCELLED.toString()).toBe('cancelled');
    });
  });

  describe('equals', () => {
    it('returns true for same instance', () => {
      expect(JobStatus.PENDING.equals(JobStatus.PENDING)).toBe(true);
    });

    it('returns true for JobStatus.from result (flyweight identity)', () => {
      expect(JobStatus.PENDING.equals(JobStatus.from('pending'))).toBe(true);
    });

    it('returns false for different statuses', () => {
      expect(JobStatus.PENDING.equals(JobStatus.RUNNING)).toBe(false);
    });
  });

  describe('flyweight identity', () => {
    it('from() returns the exact same instance', () => {
      expect(JobStatus.from('pending')).toBe(JobStatus.PENDING);
      expect(JobStatus.from('running')).toBe(JobStatus.RUNNING);
      expect(JobStatus.from('success')).toBe(JobStatus.SUCCESS);
      expect(JobStatus.from('error')).toBe(JobStatus.ERROR);
      expect(JobStatus.from('cancelled')).toBe(JobStatus.CANCELLED);
    });
  });
});

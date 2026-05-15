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
  Job,
  JobStatusEnum,
  Project,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { isEligibleForRetriggerInit } from './isEligibleForRetriggerInit';

const baseProject: Project = {
  id: '123',
  name: 'Test Project',
  sourceRepoUrl: 'https://example.com/source',
  targetRepoUrl: 'https://example.com/target',
  sourceRepoBranch: 'main',
  targetRepoBranch: 'main',
  createdAt: new Date('2024-01-01'),
  ownedBy: 'user:default/tester',
};

const makeInitJob = (status: JobStatusEnum): Job =>
  ({
    id: 'job-1',
    status,
  }) as Job;

describe('isEligibleForRetriggerInit', () => {
  it('returns true when project has no status and no init job', () => {
    expect(isEligibleForRetriggerInit(baseProject)).toBe(true);
  });

  it('returns true when modulesSummary is undefined', () => {
    const project: Project = {
      ...baseProject,
      status: { state: 'created' } as Project['status'],
    };
    expect(isEligibleForRetriggerInit(project)).toBe(true);
  });

  it('returns true when modulesSummary.total is 0', () => {
    const project: Project = {
      ...baseProject,
      status: {
        state: 'initialized',
        modulesSummary: {
          total: 0,
          finished: 0,
          waiting: 0,
          pending: 0,
          running: 0,
          error: 0,
          cancelled: 0,
        },
      },
    };
    expect(isEligibleForRetriggerInit(project)).toBe(true);
  });

  it('returns true when init job has status "error"', () => {
    const project: Project = {
      ...baseProject,
      initJob: makeInitJob('error'),
    };
    expect(isEligibleForRetriggerInit(project)).toBe(true);
  });

  it('returns true when init job has status "success" but no modules yet', () => {
    const project: Project = {
      ...baseProject,
      initJob: makeInitJob('success'),
    };
    expect(isEligibleForRetriggerInit(project)).toBe(true);
  });

  it('returns true when init job has status "cancelled"', () => {
    const project: Project = {
      ...baseProject,
      initJob: makeInitJob('cancelled'),
    };
    expect(isEligibleForRetriggerInit(project)).toBe(true);
  });

  it('returns false when init job status is "running"', () => {
    const project: Project = {
      ...baseProject,
      initJob: makeInitJob('running'),
    };
    expect(isEligibleForRetriggerInit(project)).toBe(false);
  });

  it('returns false when init job status is "pending"', () => {
    const project: Project = {
      ...baseProject,
      initJob: makeInitJob('pending'),
    };
    expect(isEligibleForRetriggerInit(project)).toBe(false);
  });

  it('returns false when project has modules', () => {
    const project: Project = {
      ...baseProject,
      status: {
        state: 'inProgress',
        modulesSummary: {
          total: 3,
          finished: 0,
          waiting: 1,
          pending: 1,
          running: 1,
          error: 0,
          cancelled: 0,
        },
      },
    };
    expect(isEligibleForRetriggerInit(project)).toBe(false);
  });

  it('returns false when project has modules and init job failed', () => {
    const project: Project = {
      ...baseProject,
      initJob: makeInitJob('error'),
      status: {
        state: 'inProgress',
        modulesSummary: {
          total: 2,
          finished: 1,
          waiting: 1,
          pending: 0,
          running: 0,
          error: 0,
          cancelled: 0,
        },
      },
    };
    expect(isEligibleForRetriggerInit(project)).toBe(false);
  });
});

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
  Artifact,
  Job,
  JobStatusEnum,
  Project,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { isEligibleForResync } from './isEligibleForResync';

const migrationPlanArtifact: Artifact = {
  id: 'artifact-1',
  type: 'migration_plan',
  value: 'https://repo.example.com/plan.md',
};

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

describe('isEligibleForResync', () => {
  it('returns false when project has no migration plan', () => {
    expect(isEligibleForResync(baseProject)).toBe(false);
  });

  it('returns false when migrationPlan is undefined and init job succeeded', () => {
    const project: Project = {
      ...baseProject,
      initJob: makeInitJob('success'),
    };
    expect(isEligibleForResync(project)).toBe(false);
  });

  it('returns true when migration plan exists and no init job is running', () => {
    const project: Project = {
      ...baseProject,
      migrationPlan: migrationPlanArtifact,
    };
    expect(isEligibleForResync(project)).toBe(true);
  });

  it('returns true when migration plan exists and init job completed with success', () => {
    const project: Project = {
      ...baseProject,
      migrationPlan: migrationPlanArtifact,
      initJob: makeInitJob('success'),
    };
    expect(isEligibleForResync(project)).toBe(true);
  });

  it('returns true when migration plan exists and init job has error status', () => {
    const project: Project = {
      ...baseProject,
      migrationPlan: migrationPlanArtifact,
      initJob: makeInitJob('error'),
    };
    expect(isEligibleForResync(project)).toBe(true);
  });

  it('returns true when migration plan exists and init job has cancelled status', () => {
    const project: Project = {
      ...baseProject,
      migrationPlan: migrationPlanArtifact,
      initJob: makeInitJob('cancelled'),
    };
    expect(isEligibleForResync(project)).toBe(true);
  });

  it('returns false when migration plan exists but init job is running', () => {
    const project: Project = {
      ...baseProject,
      migrationPlan: migrationPlanArtifact,
      initJob: makeInitJob('running'),
    };
    expect(isEligibleForResync(project)).toBe(false);
  });

  it('returns false when migration plan exists but init job is pending', () => {
    const project: Project = {
      ...baseProject,
      migrationPlan: migrationPlanArtifact,
      initJob: makeInitJob('pending'),
    };
    expect(isEligibleForResync(project)).toBe(false);
  });
});

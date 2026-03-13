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
  Project,
  ModulesStatusSummary,
  ProjectStatusState,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { areEligibleModulesToRun } from './areEligibleModulesToRun';

const baseProject: Omit<Project, 'status'> = {
  id: '123',
  abbreviation: 'TST',
  name: 'Test Project',
  sourceRepoUrl: 'https://example.com/source',
  targetRepoUrl: 'https://example.com/target',
  sourceRepoBranch: 'main',
  targetRepoBranch: 'main',
  createdAt: new Date('2024-01-01'),
  createdBy: 'user:default/tester',
};

const zeroSummary: ModulesStatusSummary = {
  total: 5,
  finished: 0,
  waiting: 0,
  pending: 0,
  running: 0,
  error: 0,
};

describe('areEligibleModulesToRun', () => {
  it('returns false when status is undefined', () => {
    const project: Project = { ...baseProject };
    expect(areEligibleModulesToRun(project)).toBe(false);
  });

  it('returns false when modulesSummary is undefined', () => {
    const project = {
      ...baseProject,
      status: { state: 'inProgress' as ProjectStatusState },
    } as Project;
    expect(areEligibleModulesToRun(project)).toBe(false);
  });

  it('returns true when waiting > 0', () => {
    const project: Project = {
      ...baseProject,
      status: {
        state: 'inProgress',
        modulesSummary: { ...zeroSummary, waiting: 3 },
      },
    };
    expect(areEligibleModulesToRun(project)).toBe(true);
  });

  it('returns true when state is "initialized" and pending > 0', () => {
    const project: Project = {
      ...baseProject,
      status: {
        state: 'initialized',
        modulesSummary: { ...zeroSummary, pending: 3 },
      },
    };
    expect(areEligibleModulesToRun(project)).toBe(true);
  });

  it('returns false when state is "initialized" but pending and waiting are 0', () => {
    const project: Project = {
      ...baseProject,
      status: {
        state: 'initialized',
        modulesSummary: { ...zeroSummary },
      },
    };
    expect(areEligibleModulesToRun(project)).toBe(false);
  });

  it('returns true when state is "initialized" and both waiting and pending > 0', () => {
    const project: Project = {
      ...baseProject,
      status: {
        state: 'initialized',
        modulesSummary: { ...zeroSummary, waiting: 2, pending: 1 },
      },
    };
    expect(areEligibleModulesToRun(project)).toBe(true);
  });

  it.each<ProjectStatusState>([
    'created',
    'initializing',
    'inProgress',
    'completed',
    'failed',
  ])(
    'returns false when state is "%s" and waiting is 0',
    (state: ProjectStatusState) => {
      const project: Project = {
        ...baseProject,
        status: {
          state,
          modulesSummary: { ...zeroSummary },
        },
      };
      expect(areEligibleModulesToRun(project)).toBe(false);
    },
  );

  it('returns false when all modules are finished and state is not "initialized"', () => {
    const project: Project = {
      ...baseProject,
      status: {
        state: 'completed',
        modulesSummary: { ...zeroSummary, total: 5, finished: 5 },
      },
    };
    expect(areEligibleModulesToRun(project)).toBe(false);
  });

  it('returns true when some modules are waiting among running/error/finished', () => {
    const project: Project = {
      ...baseProject,
      status: {
        state: 'inProgress',
        modulesSummary: {
          total: 10,
          finished: 3,
          waiting: 1,
          pending: 2,
          running: 2,
          error: 2,
        },
      },
    };
    expect(areEligibleModulesToRun(project)).toBe(true);
  });
});

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
  Module,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { getNextPhase } from './getNextPhase';

const makeJob = (phase: Job['phase'], status: Job['status']): Job =>
  ({
    id: `job-${phase}`,
    projectId: 'p1',
    moduleId: 'm1',
    phase,
    status,
    k8sJobName: `k8s-${phase}`,
    startedAt: new Date(),
  }) as Job;

const baseModule: Module = {
  id: 'm1',
  name: 'mod',
  sourcePath: '/src',
  projectId: 'p1',
};

describe('getNextPhase', () => {
  it('returns "analyze" when module has no jobs', () => {
    expect(getNextPhase(baseModule)).toBe('analyze');
  });

  it('returns "migrate" after successful analyze', () => {
    const module: Module = {
      ...baseModule,
      analyze: makeJob('analyze', 'success'),
    };
    expect(getNextPhase(module)).toBe('migrate');
  });

  it('returns "publish" after successful migrate', () => {
    const module: Module = {
      ...baseModule,
      analyze: makeJob('analyze', 'success'),
      migrate: makeJob('migrate', 'success'),
    };
    expect(getNextPhase(module)).toBe('publish');
  });

  it('returns undefined after successful publish (all phases done)', () => {
    const module: Module = {
      ...baseModule,
      analyze: makeJob('analyze', 'success'),
      migrate: makeJob('migrate', 'success'),
      publish: makeJob('publish', 'success'),
    };
    expect(getNextPhase(module)).toBeUndefined();
  });

  describe('error status handling', () => {
    it('returns "analyze" when analyze is in error', () => {
      const module: Module = {
        ...baseModule,
        analyze: makeJob('analyze', 'error'),
      };
      expect(getNextPhase(module)).toBe('analyze');
    });

    it('returns "migrate" when migrate is in error', () => {
      const module: Module = {
        ...baseModule,
        analyze: makeJob('analyze', 'success'),
        migrate: makeJob('migrate', 'error'),
      };
      expect(getNextPhase(module)).toBe('migrate');
    });

    it('returns "publish" when publish is in error', () => {
      const module: Module = {
        ...baseModule,
        analyze: makeJob('analyze', 'success'),
        migrate: makeJob('migrate', 'success'),
        publish: makeJob('publish', 'error'),
      };
      expect(getNextPhase(module)).toBe('publish');
    });
  });

  describe('cancelled status handling', () => {
    it('skips cancelled analyze and returns "analyze" (from init)', () => {
      const module: Module = {
        ...baseModule,
        analyze: makeJob('analyze', 'cancelled'),
      };
      expect(getNextPhase(module)).toBe('analyze');
    });

    it('skips cancelled migrate and returns "migrate" (next after analyze)', () => {
      const module: Module = {
        ...baseModule,
        analyze: makeJob('analyze', 'success'),
        migrate: makeJob('migrate', 'cancelled'),
      };
      expect(getNextPhase(module)).toBe('migrate');
    });

    it('skips cancelled publish and returns "publish" (next after migrate)', () => {
      const module: Module = {
        ...baseModule,
        analyze: makeJob('analyze', 'success'),
        migrate: makeJob('migrate', 'success'),
        publish: makeJob('publish', 'cancelled'),
      };
      expect(getNextPhase(module)).toBe('publish');
    });

    it('returns "analyze" when all phases are cancelled', () => {
      const module: Module = {
        ...baseModule,
        analyze: makeJob('analyze', 'cancelled'),
        migrate: makeJob('migrate', 'cancelled'),
        publish: makeJob('publish', 'cancelled'),
      };
      expect(getNextPhase(module)).toBe('analyze');
    });
  });
});

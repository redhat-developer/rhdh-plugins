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

import { getLastPhaseReached } from './getLastPhaseReached';

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

describe('getLastPhaseReached', () => {
  it('returns undefined when no phases have jobs', () => {
    expect(getLastPhaseReached(baseModule)).toBeUndefined();
  });

  it('returns analyze when only analyze exists', () => {
    const module: Module = {
      ...baseModule,
      analyze: makeJob('analyze', 'success'),
    };
    expect(getLastPhaseReached(module)?.phase).toBe('analyze');
  });

  it('returns migrate when both analyze and migrate exist', () => {
    const module: Module = {
      ...baseModule,
      analyze: makeJob('analyze', 'success'),
      migrate: makeJob('migrate', 'running'),
    };
    expect(getLastPhaseReached(module)?.phase).toBe('migrate');
  });

  it('returns publish when all phases exist', () => {
    const module: Module = {
      ...baseModule,
      analyze: makeJob('analyze', 'success'),
      migrate: makeJob('migrate', 'success'),
      publish: makeJob('publish', 'error'),
    };
    expect(getLastPhaseReached(module)?.phase).toBe('publish');
  });

  describe('ignoreCancelled = false (default)', () => {
    it('returns cancelled phase as the last reached', () => {
      const module: Module = {
        ...baseModule,
        analyze: makeJob('analyze', 'success'),
        migrate: makeJob('migrate', 'cancelled'),
      };
      expect(getLastPhaseReached(module)?.phase).toBe('migrate');
      expect(getLastPhaseReached(module)?.status).toBe('cancelled');
    });
  });

  describe('ignoreCancelled = true', () => {
    it('skips cancelled publish and returns migrate', () => {
      const module: Module = {
        ...baseModule,
        analyze: makeJob('analyze', 'success'),
        migrate: makeJob('migrate', 'success'),
        publish: makeJob('publish', 'cancelled'),
      };
      const result = getLastPhaseReached(module, true);
      expect(result?.phase).toBe('migrate');
      expect(result?.status).toBe('success');
    });

    it('skips cancelled migrate and returns analyze', () => {
      const module: Module = {
        ...baseModule,
        analyze: makeJob('analyze', 'error'),
        migrate: makeJob('migrate', 'cancelled'),
      };
      const result = getLastPhaseReached(module, true);
      expect(result?.phase).toBe('analyze');
      expect(result?.status).toBe('error');
    });

    it('returns undefined when all phases are cancelled', () => {
      const module: Module = {
        ...baseModule,
        analyze: makeJob('analyze', 'cancelled'),
        migrate: makeJob('migrate', 'cancelled'),
        publish: makeJob('publish', 'cancelled'),
      };
      expect(getLastPhaseReached(module, true)).toBeUndefined();
    });

    it('does not skip non-cancelled phases', () => {
      const module: Module = {
        ...baseModule,
        analyze: makeJob('analyze', 'running'),
      };
      const result = getLastPhaseReached(module, true);
      expect(result?.phase).toBe('analyze');
      expect(result?.status).toBe('running');
    });
  });
});

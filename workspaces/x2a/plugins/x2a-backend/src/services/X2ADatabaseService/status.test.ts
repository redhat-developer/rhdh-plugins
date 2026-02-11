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

import type {
  Job,
  Module,
  ModuleStatus,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { calculateModuleStatus, calculateProjectStatus } from './status';

function job(status: Job['status']): Job {
  return {
    id: 'job-id',
    projectId: 'project-id',
    startedAt: new Date(),
    phase: 'analyze',
    k8sJobName: 'k8s-job',
    status,
  };
}

describe('calculateModuleStatus', () => {
  it('returns pending when no jobs are provided', () => {
    expect(calculateModuleStatus({})).toBe('pending');
  });

  it('returns analyze status when only analyze job is provided', () => {
    expect(calculateModuleStatus({ analyze: job('pending') })).toBe('pending');
    expect(calculateModuleStatus({ analyze: job('running') })).toBe('running');
    expect(calculateModuleStatus({ analyze: job('success') })).toBe('success');
    expect(calculateModuleStatus({ analyze: job('error') })).toBe('error');
  });

  it('returns migrate status when only migrate job is provided', () => {
    expect(calculateModuleStatus({ migrate: job('success') })).toBe('success');
    expect(calculateModuleStatus({ migrate: job('error') })).toBe('error');
  });

  it('returns publish status when only publish job is provided', () => {
    expect(calculateModuleStatus({ publish: job('success') })).toBe('success');
    expect(calculateModuleStatus({ publish: job('running') })).toBe('running');
  });

  it('prefers migrate over analyze when both are provided', () => {
    expect(
      calculateModuleStatus({
        analyze: job('success'),
        migrate: job('error'),
      }),
    ).toBe('error');
    expect(
      calculateModuleStatus({
        analyze: job('error'),
        migrate: job('success'),
      }),
    ).toBe('success');
  });

  it('prefers publish over migrate and analyze when multiple are provided', () => {
    expect(
      calculateModuleStatus({
        analyze: job('success'),
        migrate: job('success'),
        publish: job('error'),
      }),
    ).toBe('error');
    expect(
      calculateModuleStatus({
        analyze: job('error'),
        migrate: job('error'),
        publish: job('success'),
      }),
    ).toBe('success');
  });

  it('uses last phase status so retrigger of earlier phase does not change module status', () => {
    // When publish already passed, a later retrigger on analyze that fails
    // should not change the module status (still success from publish).
    expect(
      calculateModuleStatus({
        analyze: job('error'),
        migrate: job('success'),
        publish: job('success'),
      }),
    ).toBe('success');
  });
});

/** Minimal module for project status tests; only status and publish are used by calculateProjectStatus. */
function module(
  status: ModuleStatus,
  options?: { publishStatus?: Job['status'] },
): Module {
  const m: Module = {
    id: 'mod-id',
    name: 'Module',
    sourcePath: '/path',
    projectId: 'project-id',
    status,
  };
  if (options?.publishStatus !== undefined) {
    m.publish = job(options.publishStatus);
  }
  return m;
}

function initJob(status: Job['status']): Job {
  return job(status);
}

describe('calculateProjectStatus', () => {
  describe('state: created', () => {
    it('returns created when no init job and no modules', () => {
      const result = calculateProjectStatus([], undefined);
      expect(result.state).toBe('created');
      expect(result.modulesSummary).toEqual({
        total: 0,
        finished: 0,
        waiting: 0,
        pending: 0,
        running: 0,
        error: 0,
      });
    });
  });

  describe('state: failed', () => {
    it('returns failed when at least one module has status error', () => {
      const result = calculateProjectStatus([
        module('success', { publishStatus: 'success' }),
        module('error'),
      ]);
      expect(result.state).toBe('failed');
      expect(result.modulesSummary.error).toBe(1);
    });

    it('returns failed when no init job is provided (init never ran)', () => {
      const result = calculateProjectStatus([
        module('pending'),
        module('pending'),
      ]);
      expect(result.state).toBe('failed');
    });

    it('returns failed when init job completed with error', () => {
      const result = calculateProjectStatus(
        [module('pending')],
        initJob('error'),
      );
      expect(result.state).toBe('failed');
    });

    it('returns failed even when init succeeded if any module is in error', () => {
      const result = calculateProjectStatus(
        [module('success', { publishStatus: 'success' }), module('error')],
        initJob('success'),
      );
      expect(result.state).toBe('failed');
      expect(result.modulesSummary.error).toBe(1);
    });
  });

  describe('state: initializing', () => {
    it('returns initializing when init job is pending', () => {
      const result = calculateProjectStatus(
        [module('pending'), module('pending')],
        initJob('pending'),
      );
      expect(result.state).toBe('initializing');
    });

    it('returns initializing when init job is running', () => {
      const result = calculateProjectStatus(
        [module('pending')],
        initJob('running'),
      );
      expect(result.state).toBe('initializing');
    });
  });

  describe('state: inProgress', () => {
    it('returns inProgress when init succeeded but not all modules have finished publish', () => {
      const result = calculateProjectStatus(
        [
          module('success', { publishStatus: 'success' }),
          module('success'), // no publish yet – waiting
        ],
        initJob('success'),
      );
      expect(result.state).toBe('inProgress');
      expect(result.modulesSummary.finished).toBe(1);
      expect(result.modulesSummary.total).toBe(2);
    });

    it('returns inProgress when init succeeded and no module has finished publish', () => {
      const result = calculateProjectStatus(
        [module('pending'), module('running')],
        initJob('success'),
      );
      expect(result.state).toBe('inProgress');
      expect(result.modulesSummary.finished).toBe(0);
    });
  });

  describe('state: completed', () => {
    it('returns completed when init succeeded and there are no modules', () => {
      const result = calculateProjectStatus([], initJob('success'));
      expect(result.state).toBe('completed');
      expect(result.modulesSummary.finished).toBe(0);
      expect(result.modulesSummary.total).toBe(0);
    });

    it('returns completed when init succeeded and every module has finished publish', () => {
      const result = calculateProjectStatus(
        [
          module('success', { publishStatus: 'success' }),
          module('success', { publishStatus: 'success' }),
        ],
        initJob('success'),
      );
      expect(result.state).toBe('completed');
      expect(result.modulesSummary.finished).toBe(2);
      expect(result.modulesSummary.total).toBe(2);
    });

    it('returns completed when init succeeded and single module has finished publish', () => {
      const result = calculateProjectStatus(
        [module('success', { publishStatus: 'success' })],
        initJob('success'),
      );
      expect(result.state).toBe('completed');
      expect(result.modulesSummary.finished).toBe(1);
      expect(result.modulesSummary.total).toBe(1);
    });
  });

  describe('modulesSummary counts', () => {
    it('counts total as number of project modules', () => {
      const result = calculateProjectStatus(
        [module('pending'), module('pending'), module('pending')],
        initJob('pending'),
      );
      expect(result.modulesSummary.total).toBe(3);
    });

    it('counts finished as modules with success status and publish phase success', () => {
      const result = calculateProjectStatus(
        [
          module('success', { publishStatus: 'success' }),
          module('success'), // no publish
          module('success', { publishStatus: 'success' }),
        ],
        initJob('success'),
      );
      expect(result.modulesSummary.finished).toBe(2);
    });

    it('counts waiting as modules with success status but no publish job', () => {
      const result = calculateProjectStatus(
        [
          module('success'), // success but no publish → waiting
          module('success', { publishStatus: 'success' }), // finished
        ],
        initJob('success'),
      );
      expect(result.modulesSummary.waiting).toBe(1);
      expect(result.modulesSummary.finished).toBe(1);
    });

    it('counts pending as modules with status pending', () => {
      const result = calculateProjectStatus(
        [module('pending'), module('pending'), module('success')],
        initJob('success'),
      );
      expect(result.modulesSummary.pending).toBe(2);
    });

    it('counts running as modules with status running', () => {
      const result = calculateProjectStatus(
        [module('running'), module('pending')],
        initJob('success'),
      );
      expect(result.modulesSummary.running).toBe(1);
      expect(result.modulesSummary.pending).toBe(1);
    });

    it('counts error as modules with status error', () => {
      const result = calculateProjectStatus([
        module('error'),
        module('success'),
        module('error'),
      ]);
      expect(result.modulesSummary.error).toBe(2);
      expect(result.modulesSummary.total).toBe(3);
    });

    it('returns zero counts for empty module list', () => {
      const result = calculateProjectStatus([], initJob('success'));
      expect(result.modulesSummary).toEqual({
        total: 0,
        finished: 0,
        waiting: 0,
        pending: 0,
        running: 0,
        error: 0,
      });
    });
  });
});

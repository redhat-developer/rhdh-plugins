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

function job(status: Job['status'], options?: { errorDetails?: string }): Job {
  return {
    id: 'job-id',
    projectId: 'project-id',
    startedAt: new Date(),
    phase: 'analyze',
    k8sJobName: 'k8s-job',
    status,
    ...(options?.errorDetails !== undefined && {
      errorDetails: options.errorDetails,
    }),
  };
}

describe('calculateModuleStatus', () => {
  it('returns pending when no jobs are provided', () => {
    expect(calculateModuleStatus({})).toEqual({
      status: 'pending',
      errorDetails: undefined,
    });
  });

  it('returns analyze status when only analyze job is provided', () => {
    expect(calculateModuleStatus({ analyze: job('pending') }).status).toBe(
      'pending',
    );
    expect(calculateModuleStatus({ analyze: job('running') }).status).toBe(
      'running',
    );
    expect(calculateModuleStatus({ analyze: job('success') }).status).toBe(
      'success',
    );
    expect(calculateModuleStatus({ analyze: job('error') }).status).toBe(
      'error',
    );
  });

  it('returns migrate status when only migrate job is provided', () => {
    expect(calculateModuleStatus({ migrate: job('success') }).status).toBe(
      'success',
    );
    expect(calculateModuleStatus({ migrate: job('error') }).status).toBe(
      'error',
    );
  });

  it('returns publish status when only publish job is provided', () => {
    expect(calculateModuleStatus({ publish: job('success') }).status).toBe(
      'success',
    );
    expect(calculateModuleStatus({ publish: job('running') }).status).toBe(
      'running',
    );
  });

  it('prefers migrate over analyze when both are provided', () => {
    expect(
      calculateModuleStatus({
        analyze: job('success'),
        migrate: job('error'),
      }).status,
    ).toBe('error');
    expect(
      calculateModuleStatus({
        analyze: job('error'),
        migrate: job('success'),
      }).status,
    ).toBe('success');
  });

  it('prefers publish over migrate and analyze when multiple are provided', () => {
    expect(
      calculateModuleStatus({
        analyze: job('success'),
        migrate: job('success'),
        publish: job('error'),
      }).status,
    ).toBe('error');
    expect(
      calculateModuleStatus({
        analyze: job('error'),
        migrate: job('error'),
        publish: job('success'),
      }).status,
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
      }).status,
    ).toBe('success');
  });

  describe('errorDetails', () => {
    it('returns errorDetails from analyze job when only analyze is provided', () => {
      const result = calculateModuleStatus({
        analyze: job('error', { errorDetails: 'Analyze failed: timeout' }),
      });
      expect(result.status).toBe('error');
      expect(result.errorDetails).toBe('Analyze failed: timeout');
    });

    it('returns errorDetails from migrate job when migrate is the last phase', () => {
      const result = calculateModuleStatus({
        analyze: job('success'),
        migrate: job('error', { errorDetails: 'Migration failed' }),
      });
      expect(result.status).toBe('error');
      expect(result.errorDetails).toBe('Migration failed');
    });

    it('returns errorDetails from publish job when publish is the last phase', () => {
      const result = calculateModuleStatus({
        analyze: job('success'),
        migrate: job('success'),
        publish: job('error', { errorDetails: 'Publish failed' }),
      });
      expect(result.status).toBe('error');
      expect(result.errorDetails).toBe('Publish failed');
    });

    it('returns undefined errorDetails when the chosen phase job has none', () => {
      expect(
        calculateModuleStatus({ analyze: job('error') }).errorDetails,
      ).toBeUndefined();
      expect(
        calculateModuleStatus({ publish: job('success') }).errorDetails,
      ).toBeUndefined();
    });

    it('prefers errorDetails from last phase when multiple phases have errorDetails', () => {
      const result = calculateModuleStatus({
        analyze: job('error', { errorDetails: 'Analyze error' }),
        migrate: job('error', { errorDetails: 'Migrate error' }),
        publish: job('error', { errorDetails: 'Publish error' }),
      });
      expect(result.errorDetails).toBe('Publish error');
    });

    it('returns undefined errorDetails when no jobs are provided', () => {
      expect(calculateModuleStatus({}).errorDetails).toBeUndefined();
    });
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

/**
 * Project state tests follow OpenAPI ProjectStatusState (openapi.yaml 543–549):
 * - created: Project is created but not yet initialized
 * - initializing: Project's init job is running or scheduling
 * - initialized: Project's init job finished successfully. Either module list is empty or all modules are in pending state.
 * - inProgress: At least one module is beyond the pending state.
 * - completed: All modules are in success state
 * - failed: At least one module is in error state (or init failed / no init with modules)
 */
describe('calculateProjectStatus', () => {
  describe('state: created', () => {
    it('returns created when no init job and no modules (project created but not yet initialized)', () => {
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

    it('does not return created when init job exists even with no modules', () => {
      expect(calculateProjectStatus([], initJob('pending')).state).toBe(
        'initializing',
      );
      expect(calculateProjectStatus([], initJob('success')).state).toBe(
        'initialized',
      );
    });
  });

  describe('state: failed', () => {
    it('returns failed when at least one module is in error state', () => {
      const result = calculateProjectStatus([
        module('success', { publishStatus: 'success' }),
        module('error'),
      ]);
      expect(result.state).toBe('failed');
      expect(result.modulesSummary.error).toBe(1);
    });

    it('returns failed when only one module and it is in error', () => {
      const result = calculateProjectStatus([module('error')]);
      expect(result.state).toBe('failed');
      expect(result.modulesSummary.error).toBe(1);
      expect(result.modulesSummary.total).toBe(1);
    });

    it('returns failed when all modules are in error', () => {
      const result = calculateProjectStatus([module('error'), module('error')]);
      expect(result.state).toBe('failed');
      expect(result.modulesSummary.error).toBe(2);
    });

    it('returns failed when no init job is provided but project has modules (init never ran)', () => {
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

    it('returns failed even when init succeeded if any module is in error (failed takes precedence)', () => {
      const result = calculateProjectStatus(
        [module('success', { publishStatus: 'success' }), module('error')],
        initJob('success'),
      );
      expect(result.state).toBe('failed');
      expect(result.modulesSummary.error).toBe(1);
    });
  });

  describe('state: initializing', () => {
    it('returns initializing when init job is pending (scheduling)', () => {
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

    it('returns initializing with empty module list when init is pending', () => {
      const result = calculateProjectStatus([], initJob('pending'));
      expect(result.state).toBe('initializing');
    });

    it('returns initializing with empty module list when init is running', () => {
      const result = calculateProjectStatus([], initJob('running'));
      expect(result.state).toBe('initializing');
    });
  });

  describe('state: initialized', () => {
    it('returns initialized when init succeeded and module list is empty', () => {
      const result = calculateProjectStatus([], initJob('success'));
      expect(result.state).toBe('initialized');
      expect(result.modulesSummary.total).toBe(0);
      expect(result.modulesSummary.finished).toBe(0);
    });

    it('returns initialized when init succeeded and all modules are in pending state', () => {
      const result = calculateProjectStatus(
        [module('pending'), module('pending')],
        initJob('success'),
      );
      expect(result.state).toBe('initialized');
      expect(result.modulesSummary.pending).toBe(2);
      expect(result.modulesSummary.total).toBe(2);
    });

    it('returns initialized when init succeeded and single module is pending', () => {
      const result = calculateProjectStatus(
        [module('pending')],
        initJob('success'),
      );
      expect(result.state).toBe('initialized');
      expect(result.modulesSummary.pending).toBe(1);
    });
  });

  describe('state: inProgress', () => {
    it('returns inProgress when at least one module is running (beyond pending)', () => {
      const result = calculateProjectStatus(
        [module('pending'), module('running')],
        initJob('success'),
      );
      expect(result.state).toBe('inProgress');
      expect(result.modulesSummary.running).toBe(1);
      expect(result.modulesSummary.pending).toBe(1);
    });

    it('returns inProgress when at least one module has success but not all finished publish', () => {
      const result = calculateProjectStatus(
        [
          module('success', { publishStatus: 'success' }),
          module('success'), // no publish yet – waiting
        ],
        initJob('success'),
      );
      expect(result.state).toBe('inProgress');
      expect(result.modulesSummary.finished).toBe(1);
      expect(result.modulesSummary.waiting).toBe(1);
      expect(result.modulesSummary.total).toBe(2);
    });

    it('returns inProgress when one running and rest pending', () => {
      const result = calculateProjectStatus(
        [module('running'), module('pending'), module('pending')],
        initJob('success'),
      );
      expect(result.state).toBe('inProgress');
      expect(result.modulesSummary.running).toBe(1);
      expect(result.modulesSummary.pending).toBe(2);
    });

    it('returns inProgress when mix of success (waiting), running and pending', () => {
      const result = calculateProjectStatus(
        [
          module('success'), // waiting for publish
          module('running'),
          module('pending'),
        ],
        initJob('success'),
      );
      expect(result.state).toBe('inProgress');
      expect(result.modulesSummary.waiting).toBe(1);
      expect(result.modulesSummary.running).toBe(1);
      expect(result.modulesSummary.pending).toBe(1);
    });

    it('returns inProgress when one module finished publish but others have not', () => {
      const result = calculateProjectStatus(
        [
          module('success', { publishStatus: 'success' }),
          module('pending'),
          module('pending'),
        ],
        initJob('success'),
      );
      expect(result.state).toBe('inProgress');
      expect(result.modulesSummary.finished).toBe(1);
      expect(result.modulesSummary.pending).toBe(2);
    });
  });

  describe('state: completed', () => {
    it('returns completed only when init succeeded and all modules are in success state (finished publish)', () => {
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

    it('does not return completed when module list is empty (that is initialized)', () => {
      const result = calculateProjectStatus([], initJob('success'));
      expect(result.state).not.toBe('completed');
      expect(result.state).toBe('initialized');
    });
  });

  describe('state precedence (per spec)', () => {
    it('failed overrides initializing when init is running but a module is error', () => {
      // In practice init running implies modules might not have run yet; if they do have error, failed wins.
      const result = calculateProjectStatus(
        [module('error'), module('pending')],
        initJob('running'),
      );
      expect(result.state).toBe('failed');
    });

    it('failed overrides completed when any module is in error', () => {
      const result = calculateProjectStatus(
        [
          module('success', { publishStatus: 'success' }),
          module('success', { publishStatus: 'success' }),
          module('error'),
        ],
        initJob('success'),
      );
      expect(result.state).toBe('failed');
    });

    it('initializing overrides initialized when init is pending even if all modules pending', () => {
      const result = calculateProjectStatus(
        [module('pending'), module('pending')],
        initJob('pending'),
      );
      expect(result.state).toBe('initializing');
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

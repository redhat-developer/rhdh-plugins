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

import type { Job } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { calculateModuleStatus } from './moduleStatus';

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

  it('returns cancelled when the only job is cancelled', () => {
    expect(calculateModuleStatus({ analyze: job('cancelled') }).status).toBe(
      'cancelled',
    );
    expect(calculateModuleStatus({ migrate: job('cancelled') }).status).toBe(
      'cancelled',
    );
    expect(calculateModuleStatus({ publish: job('cancelled') }).status).toBe(
      'cancelled',
    );
  });

  it('returns cancelled when the most-advanced phase is cancelled', () => {
    expect(
      calculateModuleStatus({
        analyze: job('success'),
        migrate: job('cancelled'),
      }).status,
    ).toBe('cancelled');
    expect(
      calculateModuleStatus({
        analyze: job('success'),
        migrate: job('success'),
        publish: job('cancelled'),
      }).status,
    ).toBe('cancelled');
    expect(
      calculateModuleStatus({
        analyze: job('error'),
        migrate: job('cancelled'),
        publish: job('cancelled'),
      }).status,
    ).toBe('cancelled');
  });

  it('returns non-cancelled status when a later phase succeeds even if earlier is cancelled', () => {
    expect(
      calculateModuleStatus({
        analyze: job('cancelled'),
        migrate: job('success'),
      }).status,
    ).toBe('success');
    expect(
      calculateModuleStatus({
        analyze: job('cancelled'),
        migrate: job('cancelled'),
        publish: job('success'),
      }).status,
    ).toBe('success');
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

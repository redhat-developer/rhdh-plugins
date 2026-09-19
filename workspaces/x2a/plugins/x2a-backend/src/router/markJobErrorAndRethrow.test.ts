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

import { mockServices } from '@backstage/backend-test-utils';
import type { Job } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { markJobErrorAndRethrow } from './markJobErrorAndRethrow';

function job(overrides: Partial<Job> = {}): Job {
  return {
    id: 'job-1',
    projectId: 'proj-1',
    status: 'pending',
    phase: 'init',
    createdAt: new Date(),
    ...overrides,
  } as Job;
}

describe('markJobErrorAndRethrow', () => {
  const kubeError = new Error('Timed out waiting for x2a-cluster-trusted-ca');

  it('does not overwrite a cancelled job and rethrows the original error', async () => {
    const updateJob = jest.fn();
    const x2aDatabase = {
      getJob: jest.fn().mockResolvedValue(job({ status: 'cancelled' })),
      updateJob,
    };
    const logger = mockServices.logger.mock();

    await expect(
      markJobErrorAndRethrow({
        x2aDatabase: x2aDatabase as any,
        logger,
        jobId: 'job-1',
        error: kubeError,
      }),
    ).rejects.toBe(kubeError);

    expect(updateJob).not.toHaveBeenCalled();
  });

  it('warns and still rethrows the kube error when updateJob fails', async () => {
    const updateError = new Error('db write failed');
    const x2aDatabase = {
      getJob: jest.fn().mockResolvedValue(job({ status: 'pending' })),
      updateJob: jest.fn().mockRejectedValue(updateError),
    };
    const logger = mockServices.logger.mock();

    await expect(
      markJobErrorAndRethrow({
        x2aDatabase: x2aDatabase as any,
        logger,
        jobId: 'job-1',
        error: kubeError,
      }),
    ).rejects.toBe(kubeError);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('db write failed'),
    );
  });
});

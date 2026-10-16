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

import type { LoggerService } from '@backstage/backend-plugin-api';
import { JobStatus } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import type { X2ADatabaseServiceApi } from '@red-hat-developer-hub/backstage-plugin-x2a-node';

import { stringifyError } from '../utils';

/**
 * Marks a DB job as error after kubeService.createJob fails, then rethrows.
 * Does not overwrite a job that was cancelled during the create window.
 */
export async function markJobErrorAndRethrow(args: {
  x2aDatabase: X2ADatabaseServiceApi;
  logger: LoggerService;
  jobId: string;
  error: unknown;
}): Promise<never> {
  const { x2aDatabase, logger, jobId, error } = args;

  const job = await x2aDatabase.getJob({ id: jobId });
  if (job && JobStatus.from(job.status).isCancelled()) {
    throw error;
  }

  try {
    await x2aDatabase.updateJob({
      id: jobId,
      status: 'error',
      finishedAt: new Date(),
      errorDetails: stringifyError(error),
    });
  } catch (updateError: unknown) {
    logger.warn(
      `Failed to mark job ${jobId} as error after kube createJob failure: ${stringifyError(
        updateError,
      )}`,
    );
  }

  throw error;
}

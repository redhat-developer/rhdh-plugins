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
import type { JobsResponse, JobsResponseItem } from '../types';

export function parseJobsResponse(
  response: unknown,
  logger: LoggerService,
): JobsResponse {
  // gitbeaker returns Job[] unless showExpanded is set.
  if (Array.isArray(response)) {
    return { data: response.map(toJobItem) };
  }

  if (
    !(
      response instanceof Object &&
      'data' in response &&
      Array.isArray((response as { data: unknown }).data)
    )
  ) {
    logger.error(
      `Unexpected response from GitLab Jobs API: ${JSON.stringify(response)}`,
    );
    throw new Error('Unexpected response from GitLab Jobs API');
  }

  const expanded = response as {
    data: unknown[];
    paginationInfo?: { total?: unknown };
  };

  const result: JobsResponse = {
    data: expanded.data.map(toJobItem),
  };

  if (expanded.paginationInfo instanceof Object) {
    const { total } = expanded.paginationInfo;
    result.paginationInfo = {
      total: typeof total === 'number' ? total : undefined,
    };
  }

  return result;
}

function toJobItem(item: unknown): JobsResponseItem {
  if (!(item instanceof Object)) {
    throw new TypeError('Unexpected GitLab job item: expected an object');
  }

  const createdAt = (item as { created_at?: unknown }).created_at;
  const startedAt = (item as { started_at?: unknown }).started_at;
  const finishedAt = (item as { finished_at?: unknown }).finished_at;
  const status = (item as { status?: unknown }).status;

  if (typeof createdAt !== 'string') {
    throw new TypeError(
      'Unexpected GitLab job item: created_at must be a string',
    );
  }

  if (
    startedAt !== undefined &&
    startedAt !== null &&
    typeof startedAt !== 'string'
  ) {
    throw new TypeError(
      'Unexpected GitLab job item: started_at must be a string or null',
    );
  }

  if (
    finishedAt !== undefined &&
    finishedAt !== null &&
    typeof finishedAt !== 'string'
  ) {
    throw new TypeError(
      'Unexpected GitLab job item: finished_at must be a string or null',
    );
  }

  if (status !== undefined && typeof status !== 'string') {
    throw new TypeError('Unexpected GitLab job item: status must be a string');
  }

  return {
    created_at: createdAt,
    started_at: startedAt as string | null | undefined,
    finished_at: finishedAt as string | null | undefined,
    status: status as string | undefined,
  };
}

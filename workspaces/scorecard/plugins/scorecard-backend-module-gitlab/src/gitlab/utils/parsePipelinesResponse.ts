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
import type { AllPipelinesResponse, GitlabPipelineItem } from '../types';

export function parsePipelinesResponse(
  response: unknown,
  logger: LoggerService,
): AllPipelinesResponse {
  // gitbeaker returns Pipeline[] unless showExpanded is set.
  if (Array.isArray(response)) {
    return { data: response.map(toPipelineItem) };
  }

  if (
    !(
      response instanceof Object &&
      'data' in response &&
      Array.isArray((response as { data: unknown }).data)
    )
  ) {
    logger.error(
      `Unexpected response from GitLab Pipelines API: ${JSON.stringify(
        response,
      )}`,
    );
    throw new Error('Unexpected response from GitLab Pipelines API');
  }

  const expanded = response as {
    data: unknown[];
    paginationInfo?: { total?: unknown };
  };

  const result: AllPipelinesResponse = {
    data: expanded.data.map(toPipelineItem),
  };

  if (expanded.paginationInfo instanceof Object) {
    const { total } = expanded.paginationInfo;
    result.paginationInfo = {
      total: typeof total === 'number' ? total : undefined,
    };
  }

  return result;
}

function toPipelineItem(item: unknown): GitlabPipelineItem {
  if (!(item instanceof Object)) {
    throw new TypeError('Unexpected GitLab pipeline item: expected an object');
  }

  const startedAt = (item as { started_at?: unknown }).started_at;
  const finishedAt = (item as { finished_at?: unknown }).finished_at;
  const status = (item as { status?: unknown }).status;

  if (
    startedAt !== undefined &&
    startedAt !== null &&
    typeof startedAt !== 'string'
  ) {
    throw new TypeError(
      'Unexpected GitLab pipeline item: started_at must be a string or null',
    );
  }

  if (
    finishedAt !== undefined &&
    finishedAt !== null &&
    typeof finishedAt !== 'string'
  ) {
    throw new TypeError(
      'Unexpected GitLab pipeline item: finished_at must be a string or null',
    );
  }

  if (status !== undefined && typeof status !== 'string') {
    throw new TypeError(
      'Unexpected GitLab pipeline item: status must be a string',
    );
  }

  return {
    started_at: startedAt as string | null | undefined,
    finished_at: finishedAt as string | null | undefined,
    status: status as string | undefined,
  };
}

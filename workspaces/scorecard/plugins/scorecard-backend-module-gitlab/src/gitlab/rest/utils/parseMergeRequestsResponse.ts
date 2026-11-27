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

import type { MRsResponse, MRsResponseItem } from '../../types';
import type { LoggerService } from '@backstage/backend-plugin-api';

export function parseMergeRequestsResponse(
  response: unknown,
  logger: LoggerService,
): MRsResponse {
  // gitbeaker returns MergeRequest[] unless showExpanded is set.
  if (Array.isArray(response)) {
    return { data: response.map(toMergeRequestItem) };
  }

  if (
    !(
      response instanceof Object &&
      'data' in response &&
      Array.isArray((response as { data: unknown }).data)
    )
  ) {
    logger.error(
      `Unexpected response from GitLab Merge Requests API: ${JSON.stringify(
        response,
      )}`,
    );

    throw new Error('Unexpected response from GitLab Merge Requests API');
  }

  const expanded = response as {
    data: unknown[];
    paginationInfo?: { total?: unknown };
  };

  const result: MRsResponse = {
    data: expanded.data.map(toMergeRequestItem),
  };

  if (expanded.paginationInfo instanceof Object) {
    const { total } = expanded.paginationInfo;

    result.paginationInfo = {
      total: typeof total === 'number' ? total : undefined,
    };
  }

  return result;
}

function toMergeRequestItem(item: unknown): MRsResponseItem {
  if (!(item instanceof Object)) {
    throw new TypeError(
      'Unexpected GitLab merge request item: expected an object',
    );
  }

  const closedAt = (item as { closed_at?: unknown }).closed_at;
  const mergedAt = (item as { merged_at?: unknown }).merged_at;

  if (
    closedAt !== undefined &&
    closedAt !== null &&
    typeof closedAt !== 'string'
  ) {
    throw new TypeError(
      'Unexpected GitLab merge request item: closed_at must be a string or null',
    );
  }

  if (
    mergedAt !== undefined &&
    mergedAt !== null &&
    typeof mergedAt !== 'string'
  ) {
    throw new TypeError(
      'Unexpected GitLab merge request item: merged_at must be a string or null',
    );
  }

  return {
    closed_at: closedAt as MRsResponseItem['closed_at'],
    merged_at: mergedAt as MRsResponseItem['merged_at'],
  };
}

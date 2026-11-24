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
import type { AllIssuesResponse, GitlabIssueItem } from '../types';

export function parseIssuesResponse(
  response: unknown,
  logger: LoggerService,
): AllIssuesResponse {
  // gitbeaker returns Issue[] unless showExpanded is set.
  if (Array.isArray(response)) {
    return { data: response.map(toIssueItem) };
  }

  if (
    !(
      response instanceof Object &&
      'data' in response &&
      Array.isArray((response as { data: unknown }).data)
    )
  ) {
    logger.error(
      `Unexpected response from GitLab Issues API: ${JSON.stringify(response)}`,
    );
    throw new Error('Unexpected response from GitLab Issues API');
  }

  const expanded = response as {
    data: unknown[];
    paginationInfo?: { total?: unknown };
  };

  const result: AllIssuesResponse = {
    data: expanded.data.map(toIssueItem),
  };

  if (expanded.paginationInfo instanceof Object) {
    const { total } = expanded.paginationInfo;
    result.paginationInfo = {
      total: typeof total === 'number' ? total : undefined,
    };
  }

  return result;
}

function toIssueItem(item: unknown): GitlabIssueItem {
  if (!(item instanceof Object)) {
    throw new TypeError('Unexpected GitLab issue item: expected an object');
  }

  const closedAt = (item as { closed_at?: unknown }).closed_at;
  if (
    closedAt !== undefined &&
    closedAt !== null &&
    typeof closedAt !== 'string'
  ) {
    throw new TypeError(
      'Unexpected GitLab issue item: closed_at must be a string or null',
    );
  }

  return {
    closed_at: closedAt as string | null | undefined,
  };
}

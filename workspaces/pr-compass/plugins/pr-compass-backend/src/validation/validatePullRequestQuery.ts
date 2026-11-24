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

import { InputError } from '@backstage/errors';
import { z } from 'zod';
import { PullRequestBadges } from '@red-hat-developer-hub/backstage-plugin-pr-compass-common';
import type { PullRequestFilters } from '@red-hat-developer-hub/backstage-plugin-pr-compass-node';
import { MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE } from './constants';

export function validatePullRequestQuery(query: unknown): {
  page: number;
  pageSize: number;
  filters: PullRequestFilters;
} {
  const schema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(MAX_PAGE_SIZE)
      .default(DEFAULT_PAGE_SIZE),
    badge: z.nativeEnum(PullRequestBadges).optional(),
  });

  const parsed = schema.safeParse(query);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new InputError(
      `Query parameter '${issue.path.join('.')}': ${issue.message}`,
    );
  }

  const { page, pageSize, badge } = parsed.data;
  return { page, pageSize, filters: { badge } };
}

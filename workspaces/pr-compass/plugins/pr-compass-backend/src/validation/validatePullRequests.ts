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

import { z } from 'zod';
import {
  PullRequestBadges,
  type PullRequest,
} from '@red-hat-developer-hub/backstage-plugin-pr-compass-common';

export function validatePullRequests(items: unknown[]): {
  valid: PullRequest[];
  invalidCount: number;
} {
  const valid: PullRequest[] = [];
  let invalidCount = 0;

  const pullRequestSchema = z
    .object({
      id: z.string().min(1),
      provider: z.string().min(1),
      host: z.string().min(1),
      url: z.string().url(),
      title: z.string(),
      repo: z.string().min(1),
      number: z.number().int().positive(),
      updatedAt: z.string().datetime(),
      badge: z.nativeEnum(PullRequestBadges),
      author: z.object({
        id: z.string().min(1),
        username: z.string().optional(),
        displayName: z.string().optional(),
        avatarUrl: z.string().optional(),
      }),
    })
    .refine(
      pullRequest =>
        pullRequest.id ===
        `${pullRequest.host}/${pullRequest.repo}#${pullRequest.number}`,
      {
        message:
          "must be 'host/owner/repo#number' and match host, repo and number",
        path: ['id'],
      },
    );

  items.forEach(item => {
    const result = pullRequestSchema.safeParse(item);
    if (result.success) {
      valid.push(result.data);
    } else {
      invalidCount += 1;
    }
  });

  return { valid, invalidCount };
}

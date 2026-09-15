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

import { deploymentsCollectorOutputSchema } from './deploymentSchemas';

describe('deploymentsCollectorOutputSchema', () => {
  it('accepts deployments sorted ascending by createdAt', () => {
    const result = deploymentsCollectorOutputSchema.safeParse({
      deployments: [
        {
          id: '100',
          commitSha: 'sha-1',
          createdAt: '2026-06-06T12:00:00.000Z',
          result: 'success',
        },
        {
          id: '101',
          commitSha: 'sha-2',
          createdAt: '2026-06-08T12:00:00.000Z',
          result: 'success',
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('rejects deployments that are not sorted ascending by createdAt', () => {
    const result = deploymentsCollectorOutputSchema.safeParse({
      deployments: [
        {
          id: '200',
          commitSha: 'sha-later',
          createdAt: '2026-06-08T12:00:00.000Z',
          result: 'success',
        },
        {
          id: '201',
          commitSha: 'sha-earlier',
          createdAt: '2026-06-06T12:00:00.000Z',
          result: 'success',
        },
      ],
    });

    expect(result).toMatchObject({
      success: false,
      error: {
        issues: expect.arrayContaining([
          expect.objectContaining({
            message:
              'Deployments must be sorted in ascending order by createdAt',
            path: ['deployments', 1, 'createdAt'],
          }),
        ]),
      },
    });
  });
});

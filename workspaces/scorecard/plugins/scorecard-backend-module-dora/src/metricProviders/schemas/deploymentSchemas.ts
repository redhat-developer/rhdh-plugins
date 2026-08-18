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

export const deploymentSchema = z
  .object({
    id: z.string().min(1),
    commitSha: z.string().min(1),
    environment: z.string().optional(),
    createdAt: z.string().datetime(),
    result: z.enum(['success', 'failure', '']),
  })
  .passthrough();
export type Deployment = z.infer<typeof deploymentSchema>;

export const deploymentsCollectorInputSchema = z
  .object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  })
  .passthrough();

export const deploymentsCollectorOutputSchema = z
  .object({
    deployments: z.array(deploymentSchema),
  })
  .strict()
  .superRefine((value, ctx) => {
    for (let i = 1; i < value.deployments.length; i++) {
      const previous = value.deployments[i - 1];
      const current = value.deployments[i];

      if (
        new Date(current.createdAt).getTime() <
        new Date(previous.createdAt).getTime()
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['deployments', i, 'createdAt'],
          message: 'Deployments must be sorted in ascending order by createdAt',
        });
        return;
      }
    }
  });

export type DeploymentsCollectorOutput = {
  deployments: Deployment[];
};

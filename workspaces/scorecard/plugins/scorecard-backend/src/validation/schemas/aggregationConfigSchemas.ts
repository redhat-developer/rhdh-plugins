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
import { aggregationKinds } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

const baseAggregationConfigSchema = z.object({
  id: z.string().min(1).max(128),
  title: z.string().min(1).max(80),
  metricId: z.string().min(1).max(255),
  description: z.string().min(1).max(200),
});

const statusGroupedAggregationConfigSchema = z.object({
  ...baseAggregationConfigSchema.shape,
  type: z.literal(aggregationKinds.statusGrouped),
});

const averageAggregationConfigSchema = z.object({
  ...baseAggregationConfigSchema.shape,
  type: z.literal(aggregationKinds.average),
  options: z.strictObject({
    statusScores: z
      .record(z.string(), z.number().finite())
      .refine(scores => Object.keys(scores).length > 0, {
        message: 'options.statusScores must contain at least one weight value',
      }),
    thresholds: z
      .object({
        rules: z.array(
          z.object({
            key: z.string(),
            expression: z.string(),
            color: z.string(),
          }),
        ),
      })
      .optional(),
  }),
});

export const aggregationConfigSchema = z.discriminatedUnion('type', [
  statusGroupedAggregationConfigSchema,
  averageAggregationConfigSchema,
]);

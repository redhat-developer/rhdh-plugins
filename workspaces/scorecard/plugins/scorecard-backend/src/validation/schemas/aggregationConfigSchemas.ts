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
  aggregationTypes,
  scalarAggregationTypes,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

const thresholdsConfigSchema = z.object({
  rules: z.array(
    z.object({
      key: z.string(),
      expression: z.string(),
      color: z.string().optional(),
    }),
  ),
});

const baseAggregationConfigSchema = z.object({
  id: z.string().min(1).max(128),
  title: z.string().min(1).max(80),
  metricId: z.string().min(1).max(255),
  description: z.string().min(1).max(200),
});

const statusGroupedAggregationConfigSchema = z.object({
  ...baseAggregationConfigSchema.shape,
  type: z.literal(aggregationTypes.statusGrouped),
});

const weightedStatusScoreAggregationConfigSchema = z.object({
  ...baseAggregationConfigSchema.shape,
  type: z.literal(aggregationTypes.weightedStatusScore),
  options: z.strictObject({
    statusScores: z
      .record(z.string(), z.number().finite())
      .refine(scores => Object.keys(scores).length > 0, {
        message: 'options.statusScores must contain at least one weight value',
      }),
    thresholds: thresholdsConfigSchema.optional(),
  }),
});

function scalarAggregationConfigSchema(
  type: (typeof scalarAggregationTypes)[number],
) {
  return z.object({
    ...baseAggregationConfigSchema.shape,
    type: z.literal(type),
    options: z
      .strictObject({
        thresholds: thresholdsConfigSchema.optional(),
      })
      .optional(),
  });
}

export const aggregationConfigSchema = z.discriminatedUnion('type', [
  statusGroupedAggregationConfigSchema,
  weightedStatusScoreAggregationConfigSchema,
  scalarAggregationConfigSchema(aggregationTypes.sum),
  scalarAggregationConfigSchema(aggregationTypes.average),
  scalarAggregationConfigSchema(aggregationTypes.max),
  scalarAggregationConfigSchema(aggregationTypes.min),
  scalarAggregationConfigSchema(aggregationTypes.count),
]);

/** Post-validation aggregation KPI config (Zod discriminated union). */
export type ValidatedAggregationConfig = z.infer<
  typeof aggregationConfigSchema
>;

export type WeightedStatusScoreAggregationConfig = Extract<
  ValidatedAggregationConfig,
  { type: typeof aggregationTypes.weightedStatusScore }
>;

export type ScalarAggregationConfig = Extract<
  ValidatedAggregationConfig,
  { type: (typeof scalarAggregationTypes)[number] }
>;

export type StatusGroupedAggregationConfig = Extract<
  ValidatedAggregationConfig,
  { type: typeof aggregationTypes.statusGrouped }
>;

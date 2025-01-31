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

/**
 * @public
 */
export const EntityFilterQuery = z.record(z.string(), z.string());
/**
 * @public
 */
export const AggregationsSchema = z
  .array(
    z.object({
      name: z.string().optional(),
      field: z.string(),
      value: z.string().optional(),
      type: z.enum(['count', 'min', 'max', 'avg', 'sum']),
      orderFields: z
        .array(
          z.object({
            field: z.enum(['value', 'count']),
            order: z.enum(['asc', 'desc']),
          }),
        )
        .optional(),
      havingFilter: z
        .object({
          field: z.string(),
          operator: z.enum(['=', '!=', '<>', '>', '<', '>=', '<=']),
          value: z.string(),
        })
        .optional(),
      filter: EntityFilterQuery.optional(),
    }),
  )
  .min(1);

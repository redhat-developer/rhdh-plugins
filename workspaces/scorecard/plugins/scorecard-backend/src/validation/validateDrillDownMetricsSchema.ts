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
import { InputError } from '@backstage/errors';

export function validateDrillDownMetricsSchema(query: unknown) {
  const drillDownSchema = z.object({
    page: z.coerce.number().int().min(1).max(10000).optional().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).optional().default(5),
    status: z.enum(['success', 'warning', 'error']).optional(),
    sortBy: z
      .enum(['entityName', 'owner', 'entityKind', 'timestamp', 'metricValue'])
      .optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    owner: z.preprocess(val => {
      if (val === undefined) return val;
      if (Array.isArray(val)) return val;
      return [val];
    }, z.array(z.string().min(1).max(255)).max(50).optional()),
    kind: z.string().min(1).max(100).optional(),
    entityName: z.string().min(1).max(255).optional(),
  });

  const parsed = drillDownSchema.safeParse(query);

  if (!parsed.success) {
    throw new InputError(`Invalid query parameters: ${parsed.error.message}`);
  }

  return parsed.data;
}

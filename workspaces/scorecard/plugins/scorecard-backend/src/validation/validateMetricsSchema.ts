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

export function validateMetricsSchema(query: unknown): {
  metricIds?: string;
  datasource?: string;
} {
  const catalogMetricsSchema = z.object({
    metricIds: z.string().min(1).optional(),
    datasource: z.string().min(1).optional(),
  });

  const parsed = catalogMetricsSchema.safeParse(query);

  if (!parsed.success) {
    throw new InputError(`Invalid query parameters: ${parsed.error.message}`);
  }

  return parsed.data;
}

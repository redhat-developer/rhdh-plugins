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
import type { Request, Response, NextFunction } from 'express';

/** Maximum inclusive span between `from` and `to` for time-series queries. */
export const MAX_TIME_SERIES_RANGE_DAYS = 365;
const MAX_TIME_SERIES_RANGE_MS =
  MAX_TIME_SERIES_RANGE_DAYS * 24 * 60 * 60 * 1000;

const timeRangeSchema = z
  .object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  })
  .refine(data => new Date(data.from) <= new Date(data.to), {
    message: 'from must be less than or equal to to',
    path: ['from'],
  })
  .refine(
    data =>
      new Date(data.to).getTime() - new Date(data.from).getTime() <=
      MAX_TIME_SERIES_RANGE_MS,
    {
      message: `time range must not exceed ${MAX_TIME_SERIES_RANGE_DAYS} days`,
      path: ['to'],
    },
  );

export function validateTimeSeriesQueryParams(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const schema = timeRangeSchema.and(
    z.object({
      metricId: z.string().min(1).max(255),
    }),
  );

  const parsed = schema.safeParse(req.query);

  if (!parsed.success) {
    throw new InputError(`Invalid query parameters: ${parsed.error.message}`);
  }

  next();
}

export function validateAggregationTimeSeriesQueryParams(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const parsed = timeRangeSchema.safeParse(req.query);

  if (!parsed.success) {
    throw new InputError(`Invalid query parameters: ${parsed.error.message}`);
  }

  next();
}

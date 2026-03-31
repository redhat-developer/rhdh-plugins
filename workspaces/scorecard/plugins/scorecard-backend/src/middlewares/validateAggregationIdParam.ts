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

export function validateAggregationIdParam(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const schema = z.object({
    aggregationId: z.string().min(1).max(255),
  });

  const parsed = schema.safeParse(req.params);

  if (!parsed.success) {
    throw new InputError(
      `Invalid aggregationId parameter: ${parsed.error.message}`,
    );
  }

  next();
}

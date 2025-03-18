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
import { DateTime } from 'luxon';
import { QUERY_TYPES } from '../types/event-request';

const dateRequiredSchema = (fieldName: string) =>
  z.string({
    required_error: `${fieldName} is required. Use YYYY-MM-DD (e.g., 2025-03-02)`,
  });

export const EventRequestSchema = z
  .object({
    grouping: z.enum(['hourly', 'weekly', 'daily', 'monthly']).optional(),
    start_date: dateRequiredSchema('start_date'),
    end_date: dateRequiredSchema('end_date'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    kind: z.string().optional(),
    type: z.enum(QUERY_TYPES, {
      errorMap: () => ({
        message: `Invalid type. Allowed values: ${QUERY_TYPES}`,
      }),
    }),
    format: z
      .enum(['csv', 'json'], {
        errorMap: () => ({
          message: 'Invalid format. Allowed values: json, csv',
        }),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    const startDate = DateTime.fromISO(data.start_date);
    const endDate = DateTime.fromISO(data.end_date);

    if (!startDate.isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Invalid date format for start_date. Expected YYYY-MM-DD (e.g., 2025-03-02)',
        path: ['start_date'],
      });
    }

    if (!endDate.isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Invalid date format for end_date. Expected YYYY-MM-DD (e.g., 2025-03-02)',
        path: ['end_date'],
      });
    }

    if (startDate.isValid && endDate.isValid && startDate > endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'start_date should not be greater than end_date',
        path: ['end_date'],
      });
    }
  });

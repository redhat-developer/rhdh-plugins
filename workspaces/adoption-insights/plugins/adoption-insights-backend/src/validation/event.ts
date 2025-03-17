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

const JsonObjectSchema = z.record(
  z.union([z.string(), z.boolean(), z.number(), z.undefined()]),
);
export const EventSchema = z.object({
  user_ref: z.string({ required_error: 'User Id is required' }).min(1),
  plugin_id: z.string({ required_error: 'Plugin ID is required' }).min(1),
  action: z.string({ required_error: 'Action is required' }).min(1),
  context: z.union([JsonObjectSchema, z.string()]),
  subject: z.string().optional(),
  attributes: z.union([JsonObjectSchema, z.string()]).optional(),
  value: z.number().optional(),
});

export const validateEvent = (event: any) => EventSchema.parse(event);

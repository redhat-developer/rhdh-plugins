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

/** Run input accepted by the agentic-chat backend. @public */
export const runAgentRequestSchema = z
  .object({
    query: z
      .string()
      .min(1)
      .max(32768)
      .refine(value => value.trim().length > 0),
    provider: z
      .string()
      .min(1)
      .refine(value => value.trim().length > 0),
    model: z
      .string()
      .min(1)
      .refine(value => value.trim().length > 0),
    agentRef: z
      .string()
      .min(1)
      .refine(value => value.trim().length > 0),
    conversation_id: z
      .string()
      .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/)
      .optional(),
  })
  .strict();

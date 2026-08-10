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

export const incidentsCollectorInputSchema = z
  .object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  })
  .passthrough();

const incidentSchema = z.object({
  id: z.string(),
  createdAt: z.string().datetime(),
  resolutionAt: z.string().datetime().nullable(),
});

export const incidentsCollectorOutputSchema = z.object({
  incidents: z.array(incidentSchema),
});

export type Incident = z.infer<typeof incidentSchema>;

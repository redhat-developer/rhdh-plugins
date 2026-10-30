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

import type { SchedulerServiceTaskScheduleDefinitionConfig } from '@backstage/backend-plugin-api';

export interface Config {
  npxSkillConnector?: {
    /**
     * Source-scoped configurations. Each source produces an independent
     * SkillSnapshot served via GET /skills/:sourceId.
     * @visibility backend
     */
    sources?: Array<{
      /**
       * Stable source identifier. Must be unique across all sources.
       * @visibility backend
       */
      id: string;
      /**
       * Public HTTPS URL of the Agent Skills v0.2 discovery index.
       * @visibility backend
       */
      indexUrl: string;
      /**
       * Additional HTTPS origins permitted for artifact redirects. The
       * initial index origin is always allowed. Omitted means no
       * additional origins are permitted.
       * @visibility backend
       */
      allowedOrigins?: string[];
      /**
       * Standard Backstage schedule for this source. When omitted, runs
       * immediately and every ten minutes. Scope must be local.
       * @visibility backend
       */
      schedule?: SchedulerServiceTaskScheduleDefinitionConfig;
    }>;
  };
}

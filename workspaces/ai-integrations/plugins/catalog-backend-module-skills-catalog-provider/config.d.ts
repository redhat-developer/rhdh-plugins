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
  catalog?: {
    providers?: {
      /**
       * Common skills catalog entity provider configuration.
       *
       * Each keyed entry defines an independent provider instance that
       * polls one or more connector sources and produces `AiResource`
       * entities with `spec.type: skill`.
       */
      skillsCatalogProvider?: {
        [instanceId: string]: {
          /**
           * Configured connector sources. Each source is polled
           * independently; a failure in one does not affect others.
           * @visibility backend
           */
          sources: Array<{
            /**
             * Backstage plugin ID of the connector (e.g.,
             * `skill-image-connector`). Resolved through Backstage
             * discovery to obtain the connector's base URL.
             * @visibility backend
             */
            connectorPluginId: string;
            /**
             * Source identifier passed to `GET /skills/:sourceId`.
             * Must be unique within this provider instance for the
             * same `(source.type, source.id)` tuple.
             * @visibility backend
             */
            sourceId: string;
            /**
             * Expected source type: `oci` or `npx`. The provider
             * rejects snapshots whose `source.type` does not match.
             * @visibility backend
             */
            sourceType: string;
          }>;
          /**
           * Catalog namespace for all entities produced by this
           * provider instance. Defaults to `default`.
           * @visibility backend
           */
          namespace?: string;
          /**
           * Default catalog owner applied when the skill record
           * lacks an `owner` hint or the hint is invalid. Required.
           * @visibility backend
           */
          defaultOwner: string;
          /**
           * Default catalog lifecycle applied when the skill record
           * lacks a `lifecycle` hint or the hint is invalid. Required.
           * @visibility backend
           */
          defaultLifecycle: string;
          /**
           * Backstage scheduler task schedule for polling connector
           * endpoints. Defaults to ten-minute frequency, zero initial
           * delay, and ten-minute timeout.
           * @visibility backend
           */
          schedule?: SchedulerServiceTaskScheduleDefinitionConfig;
        };
      };
    };
  };
}

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
import { SchedulerServiceTaskScheduleDefinitionConfig } from '@backstage/backend-plugin-api';

/** Per-registry instance options under `catalog.providers.mcpRegistry.<id>`. */
interface McpRegistryInstanceConfig {
  /** @visibility backend */
  baseUrl: string;
  /** @visibility backend */
  baseName?: string;
  /** @visibility backend */
  apiVersion?: string;
  /** @visibility backend */
  defaultOwner?: string;
  /** @visibility backend */
  defaultLifecycle?: string;
  /** @visibility backend */
  pageLimit?: number;
  /** @visibility backend */
  pageSize?: number;
  /** @visibility backend */
  maxEntries?: number;
  /**
   * When true, only ingest servers that declare at least one native
   * remote. Package-only / placeholder-remote servers are skipped.
   *
   * @visibility backend
   */
  remotesOnly?: boolean;
  /** @visibility backend */
  hostAllowList?: string[];
  /** @visibility backend */
  schedule?: SchedulerServiceTaskScheduleDefinitionConfig;
}

export interface Config {
  catalog?: {
    providers?: {
      /**
       * Map of MCP Registry provider instances. This implementation only
       * reads the reserved `mcpRegistry` instance id; additional keys are
       * ignored with a warning until multi-registry support lands.
       */
      mcpRegistry?: {
        mcpRegistry?: McpRegistryInstanceConfig;
      };
    };
  };
}

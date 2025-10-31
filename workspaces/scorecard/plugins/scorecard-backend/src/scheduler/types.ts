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

import type { Config } from '@backstage/config';
import { CatalogService } from '@backstage/plugin-catalog-node';
import { DatabaseMetricValues } from '../database/DatabaseMetricValues';
import { MetricProvidersRegistry } from '../providers/MetricProvidersRegistry';
import {
  AuthService,
  LoggerService,
  SchedulerService,
} from '@backstage/backend-plugin-api';

export interface SchedulerTask {
  start(): Promise<void>;
}

export interface SchedulerOptions {
  auth: AuthService;
  catalog: CatalogService;
  config: Config;
  logger: LoggerService;
  scheduler: SchedulerService;
  database: DatabaseMetricValues;
  metricProvidersRegistry: MetricProvidersRegistry;
}

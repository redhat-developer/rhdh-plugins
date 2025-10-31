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

import {
  AuthService,
  LoggerService,
  SchedulerService,
} from '@backstage/backend-plugin-api';
import { CatalogService } from '@backstage/plugin-catalog-node';
import { MetricProvidersRegistry } from '../providers/MetricProvidersRegistry';
import type { Config } from '@backstage/config';
import { CLEANUP_EXPIRED_METRICS_ID } from './constants';
import { CleanupExpiredMetricsTask } from './tasks/CleanupExpiredMetricsTask';
import { PullMetricsByProviderTask } from './tasks/PullMetricsByProviderTask';
import { SchedulerOptions, SchedulerTask } from './types';
import { DatabaseMetricValues } from '../database/DatabaseMetricValues';

export class Scheduler {
  private readonly auth: AuthService;
  private readonly catalog: CatalogService;
  private readonly config: Config;
  private readonly logger: LoggerService;
  private readonly scheduler: SchedulerService;
  private readonly database: DatabaseMetricValues;
  private readonly metricProvidersRegistry: MetricProvidersRegistry;

  private tasks: Array<{ name: string; task: SchedulerTask }> = [];

  private constructor(options: SchedulerOptions) {
    this.auth = options.auth;
    this.catalog = options.catalog;
    this.config = options.config;
    this.logger = options.logger;
    this.scheduler = options.scheduler;
    this.database = options.database;
    this.metricProvidersRegistry = options.metricProvidersRegistry;
  }

  static create(options: SchedulerOptions): Scheduler {
    return new Scheduler(options);
  }

  async start(): Promise<void> {
    this.initializeTasks();
    this.initializeTasksByProviders();

    const results = await Promise.allSettled(
      this.tasks.map(({ name, task }) => this.startTask(name, task)),
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;

    let index = 0;

    for (const result of results) {
      if (result.status === 'rejected') {
        this.logger.warn(
          `Failed to start task '${this.tasks[index].name}': ${result.reason}`,
        );
      }
      index++;
    }

    this.logger.info(`Scheduled: ${successCount}/${this.tasks.length} tasks`);
  }

  private initializeTasks(): void {
    this.tasks = [
      {
        name: CLEANUP_EXPIRED_METRICS_ID,
        task: new CleanupExpiredMetricsTask({
          scheduler: this.scheduler,
          logger: this.logger,
          database: this.database,
          config: this.config,
        }),
      },
    ];
  }

  private initializeTasksByProviders(): void {
    const providers = this.metricProvidersRegistry.listProviders();

    for (const provider of providers) {
      this.tasks.push({
        name: provider.getProviderId(),
        task: new PullMetricsByProviderTask(
          {
            scheduler: this.scheduler,
            logger: this.logger,
            database: this.database,
            config: this.config,
            catalog: this.catalog,
            auth: this.auth,
          },
          provider,
        ),
      });
    }
  }

  private async startTask(name: string, task: SchedulerTask): Promise<void> {
    try {
      await task.start();
    } catch (error) {
      this.logger.error(`Failed to start task '${name}': ${error}`, error);
      throw error;
    }
  }
}

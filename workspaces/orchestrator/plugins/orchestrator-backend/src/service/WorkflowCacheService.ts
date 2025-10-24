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

import { LoggerService, SchedulerService } from '@backstage/backend-plugin-api';

import { DataIndexService } from './DataIndexService';
import { SonataFlowService } from './SonataFlowService';

export type CacheHandler = 'skip' | 'throw';

export class WorkflowCacheService {
  private readonly TASK_ID = 'task__Orchestrator__WorkflowCacheService';
  private readonly DEFAULT_FREQUENCY_IN_SECONDS = 5;
  private readonly DEFAULT_TIMEOUT_IN_MINUTES = 10;
  private readonly definitionIdCache = new Set<string>();
  private readonly unavailableDefinitionIdCache = new Set<string>();

  constructor(
    private readonly logger: LoggerService,
    private readonly dataIndexService: DataIndexService,
    private readonly sonataFlowService: SonataFlowService,
  ) {}

  public get definitionIds(): string[] {
    return Array.from(this.definitionIdCache);
  }

  public get unavailableDefinitionIds(): string[] {
    return Array.from(this.unavailableDefinitionIdCache);
  }

  private isEmpty(): boolean {
    return (
      this.definitionIdCache.size === 0 &&
      this.unavailableDefinitionIdCache.size === 0
    );
  }

  public isAvailable(
    definitionId?: string,
    cacheHandler: CacheHandler = 'skip',
  ): boolean {
    if (!definitionId) {
      return false;
    }
    const isAvailable = this.definitionIdCache.has(definitionId);
    if (!isAvailable && cacheHandler === 'throw') {
      throw new Error(
        `Workflow service "${definitionId}" not available at the moment`,
      );
    }
    return isAvailable;
  }

  public schedule(args: {
    scheduler: SchedulerService;
    frequencyInSeconds?: number;
    timeoutInMinutes?: number;
  }): void {
    const {
      scheduler,
      frequencyInSeconds = this.DEFAULT_FREQUENCY_IN_SECONDS,
      timeoutInMinutes = this.DEFAULT_TIMEOUT_IN_MINUTES,
    } = args;

    scheduler.scheduleTask({
      id: this.TASK_ID,
      frequency: { seconds: frequencyInSeconds },
      timeout: { minutes: timeoutInMinutes },
      fn: async () => {
        await this.runTask();
      },
    });
  }

  private async runTask() {
    try {
      const idUrlMap = await this.dataIndexService.fetchWorkflowServiceUrls();
      this.definitionIdCache.forEach(definitionId => {
        if (!idUrlMap[definitionId]) {
          this.definitionIdCache.delete(definitionId);
        }
      });
      this.unavailableDefinitionIdCache.forEach(definitionId => {
        if (!idUrlMap[definitionId]) {
          this.unavailableDefinitionIdCache.delete(definitionId);
        }
      });
      await Promise.all(
        Object.entries(idUrlMap).map(async ([definitionId, serviceUrl]) => {
          let isServiceUp = false;
          try {
            isServiceUp = await this.sonataFlowService.pingWorkflowService({
              definitionId,
              serviceUrl,
            });
          } catch (err) {
            this.logger.error(
              `Ping workflow ${definitionId} service threw error: ${err}`,
            );
          }
          if (isServiceUp) {
            this.definitionIdCache.add(definitionId);
            this.unavailableDefinitionIdCache.delete(definitionId);
          } else {
            this.logger.error(
              `Failed to ping service for workflow ${definitionId} at ${serviceUrl}`,
            );
            if (this.definitionIdCache.has(definitionId)) {
              this.definitionIdCache.delete(definitionId);
            }
            this.unavailableDefinitionIdCache.add(definitionId);
          }
        }),
      );

      const workflowDefinitionIds = this.isEmpty()
        ? 'empty cache'
        : Array.from(this.definitionIdCache)
            .concat(Array.from(this.unavailableDefinitionIdCache))
            .join(', ');

      this.logger.debug(
        `${this.TASK_ID} updated the workflow definition ID cache to: ${workflowDefinitionIds}`,
      );
    } catch (error) {
      this.logger.error(`Error running ${this.TASK_ID}: ${error}`);
      return;
    }
  }
}

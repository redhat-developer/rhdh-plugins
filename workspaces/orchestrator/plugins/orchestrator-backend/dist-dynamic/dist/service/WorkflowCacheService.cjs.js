'use strict';

class WorkflowCacheService {
  constructor(logger, dataIndexService, sonataFlowService) {
    this.logger = logger;
    this.dataIndexService = dataIndexService;
    this.sonataFlowService = sonataFlowService;
  }
  TASK_ID = "task__Orchestrator__WorkflowCacheService";
  DEFAULT_FREQUENCY_IN_SECONDS = 5;
  DEFAULT_TIMEOUT_IN_MINUTES = 10;
  definitionIdCache = /* @__PURE__ */ new Set();
  unavailableDefinitionIdCache = /* @__PURE__ */ new Set();
  get definitionIds() {
    return Array.from(this.definitionIdCache);
  }
  get unavailableDefinitionIds() {
    return Array.from(this.unavailableDefinitionIdCache);
  }
  isEmpty() {
    return this.definitionIdCache.size === 0 && this.unavailableDefinitionIdCache.size === 0;
  }
  isAvailable(definitionId, cacheHandler = "skip") {
    if (!definitionId) {
      return false;
    }
    const isAvailable = this.definitionIdCache.has(definitionId);
    if (!isAvailable && cacheHandler === "throw") {
      throw new Error(
        `Workflow service "${definitionId}" not available at the moment`
      );
    }
    return isAvailable;
  }
  schedule(args) {
    const {
      scheduler,
      frequencyInSeconds = this.DEFAULT_FREQUENCY_IN_SECONDS,
      timeoutInMinutes = this.DEFAULT_TIMEOUT_IN_MINUTES
    } = args;
    scheduler.scheduleTask({
      id: this.TASK_ID,
      frequency: { seconds: frequencyInSeconds },
      timeout: { minutes: timeoutInMinutes },
      fn: async () => {
        await this.runTask();
      }
    });
  }
  async runTask() {
    try {
      const idUrlMap = await this.dataIndexService.fetchWorkflowServiceUrls();
      this.definitionIdCache.forEach((definitionId) => {
        if (!idUrlMap[definitionId]) {
          this.definitionIdCache.delete(definitionId);
        }
      });
      this.unavailableDefinitionIdCache.forEach((definitionId) => {
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
              serviceUrl
            });
          } catch (err) {
            this.logger.error(
              `Ping workflow ${definitionId} service threw error: ${err}`
            );
          }
          if (isServiceUp) {
            this.definitionIdCache.add(definitionId);
            this.unavailableDefinitionIdCache.delete(definitionId);
          } else {
            this.logger.error(
              `Failed to ping service for workflow ${definitionId} at ${serviceUrl}`
            );
            if (this.definitionIdCache.has(definitionId)) {
              this.definitionIdCache.delete(definitionId);
            }
            this.unavailableDefinitionIdCache.add(definitionId);
          }
        })
      );
      const workflowDefinitionIds = this.isEmpty() ? "empty cache" : Array.from(this.definitionIdCache).concat(Array.from(this.unavailableDefinitionIdCache)).join(", ");
      this.logger.debug(
        `${this.TASK_ID} updated the workflow definition ID cache to: ${workflowDefinitionIds}`
      );
    } catch (error) {
      this.logger.error(`Error running ${this.TASK_ID}: ${error}`);
      return;
    }
  }
}

exports.WorkflowCacheService = WorkflowCacheService;
//# sourceMappingURL=WorkflowCacheService.cjs.js.map

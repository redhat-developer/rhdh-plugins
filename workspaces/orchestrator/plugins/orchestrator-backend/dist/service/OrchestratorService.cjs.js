'use strict';

class OrchestratorService {
  constructor(sonataFlowService, dataIndexService, workflowCacheService) {
    this.sonataFlowService = sonataFlowService;
    this.dataIndexService = dataIndexService;
    this.workflowCacheService = workflowCacheService;
  }
  // Data Index Service Wrapper
  getWorkflowIds() {
    return this.workflowCacheService.definitionIds;
  }
  async abortWorkflowInstance(args) {
    return await this.sonataFlowService.abortInstance(args);
  }
  async fetchWorkflowInfo(args) {
    const { definitionId } = args;
    return await this.dataIndexService.fetchWorkflowInfo(definitionId);
  }
  async fetchInstances(args) {
    const definitionIds = args.workflowIds ? args.workflowIds : this.workflowCacheService.definitionIds;
    return await this.dataIndexService.fetchInstances({
      definitionIds,
      pagination: args.pagination,
      filter: args.filter
    });
  }
  async fetchDefinitionIdsFromInstances(args) {
    return await this.dataIndexService.fetchDefinitionIdsFromInstances(args);
  }
  async fetchWorkflowSource(args) {
    const { definitionId } = args;
    return await this.dataIndexService.fetchWorkflowSource(definitionId);
  }
  async fetchInstanceVariables(args) {
    const { instanceId } = args;
    return await this.dataIndexService.fetchInstanceVariables(instanceId);
  }
  async fetchInstance(args) {
    const { instanceId } = args;
    const instance = await this.dataIndexService.fetchInstance(instanceId);
    return instance;
  }
  // SonataFlow Service Wrapper
  async fetchWorkflowInfoOnService(args) {
    return await this.sonataFlowService.fetchWorkflowInfoOnService(args);
  }
  async fetchWorkflowDefinition(args) {
    const { definitionId } = args;
    return await this.sonataFlowService.fetchWorkflowDefinition(definitionId);
  }
  async fetchWorkflowOverviews(args) {
    const overviews = await this.sonataFlowService.fetchWorkflowOverviews({
      definitionIds: this.workflowCacheService.definitionIds?.concat(
        this.workflowCacheService.unavailableDefinitionIds
      ),
      pagination: args.pagination,
      filter: args.filter,
      targetEntity: args.targetEntity
    });
    return overviews?.map((overview) => {
      const updatedOverview = overview;
      updatedOverview.isAvailable = this.workflowCacheService.isAvailable(
        updatedOverview.workflowId
      );
      return updatedOverview;
    });
  }
  async executeWorkflow(args) {
    return await this.sonataFlowService.executeWorkflow(args);
  }
  async retriggerWorkflow(args) {
    return this.sonataFlowService.retriggerInstance(args);
  }
  async fetchWorkflowOverview(args) {
    const { definitionId } = args;
    const isWorkflowAvailable = this.workflowCacheService.isAvailable(definitionId);
    const overview = await this.sonataFlowService.fetchWorkflowOverview(definitionId);
    if (overview) overview.isAvailable = isWorkflowAvailable;
    return overview;
  }
  async pingWorkflowService(args) {
    const { definitionId, serviceUrl } = args;
    const isServiceUp = await this.sonataFlowService.pingWorkflowService({
      definitionId,
      serviceUrl
    });
    return isServiceUp;
  }
}

exports.OrchestratorService = OrchestratorService;
//# sourceMappingURL=OrchestratorService.cjs.js.map

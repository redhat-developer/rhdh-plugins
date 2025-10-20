'use strict';

var backstagePluginOrchestratorCommon = require('@redhat/backstage-plugin-orchestrator-common');
var Helper = require('../Helper.cjs.js');
var V2Mappings = require('./mapping/V2Mappings.cjs.js');

const FETCH_INSTANCE_MAX_ATTEMPTS = 10;
const FETCH_INSTANCE_RETRY_DELAY_MS = 1e3;
class V2 {
  constructor(orchestratorService) {
    this.orchestratorService = orchestratorService;
  }
  async getWorkflowsOverviewForEntity(targetEntity, annotationWorkflowIds) {
    let combinedWorkflowIds = annotationWorkflowIds;
    if (targetEntity) {
      const definitionIdsFromInstances = await this.orchestratorService.fetchDefinitionIdsFromInstances({
        targetEntity
      });
      if (definitionIdsFromInstances.length > 0) {
        combinedWorkflowIds = Array.from(
          /* @__PURE__ */ new Set([...combinedWorkflowIds, ...definitionIdsFromInstances])
        );
      }
    }
    if (combinedWorkflowIds.length === 0) {
      return {
        overviews: []
      };
    }
    const workflowIdsFilter = {
      field: "id",
      operator: "IN",
      value: combinedWorkflowIds
    };
    return this.getWorkflowsOverview(
      void 0,
      workflowIdsFilter,
      targetEntity
    );
  }
  async getWorkflowsOverview(pagination, filter, targetEntity) {
    const overviews = await this.orchestratorService.fetchWorkflowOverviews({
      pagination,
      filter,
      targetEntity
    });
    if (!overviews) {
      throw new Error("Couldn't fetch workflow overviews");
    }
    const result = {
      overviews: overviews.map((item) => V2Mappings.mapToWorkflowOverviewDTO(item)),
      paginationInfo: {
        pageSize: pagination?.limit,
        offset: pagination?.offset
      }
    };
    return result;
  }
  getWorkflowIds() {
    return this.orchestratorService.getWorkflowIds();
  }
  async getWorkflowOverviewById(workflowId) {
    const overview = await this.orchestratorService.fetchWorkflowOverview({
      definitionId: workflowId
    });
    if (!overview) {
      throw new Error(`Couldn't fetch workflow overview for ${workflowId}`);
    }
    return V2Mappings.mapToWorkflowOverviewDTO(overview);
  }
  async getWorkflowById(workflowId) {
    const resultV1 = await this.getWorkflowSourceById(workflowId);
    return V2Mappings.mapToWorkflowDTO(resultV1);
  }
  async getWorkflowSourceById(workflowId) {
    const source = await this.orchestratorService.fetchWorkflowSource({
      definitionId: workflowId
    });
    if (!source) {
      throw new Error(`Couldn't fetch workflow source for ${workflowId}`);
    }
    return source;
  }
  async getInstances(pagination, filter, workflowIds) {
    const instances = await this.orchestratorService.fetchInstances({
      pagination,
      filter,
      workflowIds
    });
    const result = {
      items: instances?.map(V2Mappings.mapToProcessInstanceDTO),
      paginationInfo: {
        pageSize: pagination?.limit,
        offset: pagination?.offset
      }
    };
    return result;
  }
  async getInstanceById(instanceId) {
    const instance = await this.orchestratorService.fetchInstance({
      instanceId
    });
    if (!instance) {
      throw new Error(`Couldn't fetch process instance ${instanceId}`);
    }
    return V2Mappings.mapToProcessInstanceDTO(instance);
  }
  async executeWorkflow(executeWorkflowRequestDTO, workflowId, initiatorEntity, backstageToken) {
    const definition = await this.orchestratorService.fetchWorkflowInfo({
      definitionId: workflowId
    });
    if (!definition) {
      throw new Error(`Couldn't fetch workflow definition for ${workflowId}`);
    }
    if (!definition.serviceUrl) {
      throw new Error(`ServiceURL is not defined for workflow ${workflowId}`);
    }
    const executionResponse = await this.orchestratorService.executeWorkflow({
      definitionId: workflowId,
      inputData: {
        workflowdata: executeWorkflowRequestDTO.inputData,
        initiatorEntity,
        targetEntity: executeWorkflowRequestDTO.targetEntity
      },
      authTokens: executeWorkflowRequestDTO.authTokens,
      serviceUrl: definition.serviceUrl,
      backstageToken
    });
    if (!executionResponse) {
      throw new Error(`Couldn't execute workflow ${workflowId}`);
    }
    await Helper.retryAsyncFunction({
      asyncFn: () => this.orchestratorService.fetchInstance({
        instanceId: executionResponse.id
      }),
      maxAttempts: FETCH_INSTANCE_MAX_ATTEMPTS,
      delayMs: FETCH_INSTANCE_RETRY_DELAY_MS
    });
    if (!executionResponse) {
      throw new Error("Error executing workflow with id ${workflowId}");
    }
    return V2Mappings.mapToExecuteWorkflowResponseDTO(workflowId, executionResponse);
  }
  async retriggerInstance(workflowId, instanceId, retriggerInstanceRequestDTO, backstageToken) {
    const definition = await this.orchestratorService.fetchWorkflowInfo({
      definitionId: workflowId
    });
    if (!definition) {
      throw new Error(`Couldn't fetch workflow definition for ${workflowId}`);
    }
    if (!definition.serviceUrl) {
      throw new Error(`ServiceURL is not defined for workflow ${workflowId}`);
    }
    const response = await this.orchestratorService.retriggerWorkflow({
      definitionId: workflowId,
      instanceId,
      serviceUrl: definition.serviceUrl,
      authTokens: retriggerInstanceRequestDTO.authTokens,
      backstageToken
    });
    if (!response) {
      throw new Error(
        `Couldn't retrigger instance ${instanceId} of workflow ${workflowId}`
      );
    }
  }
  async abortWorkflow(workflowId, instanceId) {
    const definition = await this.orchestratorService.fetchWorkflowInfo({
      definitionId: workflowId
    });
    if (!definition) {
      throw new Error(`Couldn't fetch workflow definition for ${workflowId}`);
    }
    if (!definition.serviceUrl) {
      throw new Error(`ServiceURL is not defined for workflow ${workflowId}`);
    }
    await this.orchestratorService.abortWorkflowInstance({
      definitionId: workflowId,
      instanceId,
      serviceUrl: definition.serviceUrl
    });
    return `Workflow instance ${instanceId} successfully aborted`;
  }
  async getWorkflowStatuses() {
    return [
      backstagePluginOrchestratorCommon.ProcessInstanceState.Active,
      backstagePluginOrchestratorCommon.ProcessInstanceState.Error,
      backstagePluginOrchestratorCommon.ProcessInstanceState.Completed,
      backstagePluginOrchestratorCommon.ProcessInstanceState.Aborted,
      backstagePluginOrchestratorCommon.ProcessInstanceState.Suspended,
      backstagePluginOrchestratorCommon.ProcessInstanceState.Pending
    ].map((status) => V2Mappings.mapToWorkflowRunStatusDTO(status));
  }
  async getWorkflowInputSchemaById(workflowId, serviceUrl) {
    return this.orchestratorService.fetchWorkflowInfoOnService({
      definitionId: workflowId,
      serviceUrl
    });
  }
  async pingWorkflowService(workflowId) {
    const definition = await this.orchestratorService.fetchWorkflowInfo({
      definitionId: workflowId
    });
    if (!definition) {
      throw new Error(`Couldn't fetch workflow definition for ${workflowId}`);
    }
    if (!definition.serviceUrl) {
      throw new Error(`ServiceURL is not defined for workflow ${workflowId}`);
    }
    const isAvailableNow = await this.orchestratorService.pingWorkflowService({
      definitionId: workflowId,
      serviceUrl: definition.serviceUrl
    });
    if (!isAvailableNow) {
      throw new Error(
        `Workflow service for workflow ${workflowId} at ${definition.serviceUrl}/management/processes/${workflowId} is not available at the moment.`
      );
    }
    return isAvailableNow;
  }
  extractQueryParam(req, key) {
    return req.query[key];
  }
}

exports.V2 = V2;
//# sourceMappingURL=v2.cjs.js.map

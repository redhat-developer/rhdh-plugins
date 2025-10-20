'use strict';

var capitalize = require('lodash/capitalize');
var backstagePluginOrchestratorCommon = require('@redhat/backstage-plugin-orchestrator-common');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e : { default: e }; }

var capitalize__default = /*#__PURE__*/_interopDefaultCompat(capitalize);

class SonataFlowService {
  constructor(dataIndexService, logger) {
    this.dataIndexService = dataIndexService;
    this.logger = logger;
  }
  async fetchWorkflowInfoOnService(args) {
    const urlToFetch = `${args.serviceUrl}/management/processes/${args.definitionId}`;
    let response;
    try {
      response = await fetch(urlToFetch);
    } catch (error) {
      this.logger.error(
        `Failed to fetch from ${urlToFetch}: ${error.message}`
      );
    }
    const jsonResponse = await this.handleWorkflowServiceResponse(
      "Get workflow info",
      args.definitionId,
      urlToFetch,
      response,
      "GET"
    );
    this.logger.debug(
      `Fetch workflow info result: ${JSON.stringify(jsonResponse)}`
    );
    return jsonResponse;
  }
  async fetchWorkflowDefinition(definitionId) {
    const source = await this.dataIndexService.fetchWorkflowSource(definitionId);
    if (source) {
      return backstagePluginOrchestratorCommon.fromWorkflowSource(source);
    }
    return void 0;
  }
  async fetchWorkflowOverviews(args) {
    const { definitionIds, pagination, filter, targetEntity } = args;
    const workflowInfos = await this.dataIndexService.fetchWorkflowInfos({
      definitionIds,
      pagination,
      filter
    });
    if (!workflowInfos?.length) {
      return [];
    }
    const items = await Promise.all(
      workflowInfos.filter((info) => info.source).map(
        (info) => this.fetchWorkflowOverviewBySource(info.source, targetEntity)
      )
    );
    return items.filter((item) => !!item);
  }
  async executeWorkflow(args) {
    const urlToFetch = `${args.serviceUrl}/${args.definitionId}`;
    const headers = {
      "Content-Type": "application/json"
    };
    this.addAuthHeaders(headers, args.authTokens, args.backstageToken);
    const headerKeys = Object.keys(headers);
    this.logger.info(
      `Executing workflow ${args.definitionId} with headers: ${headerKeys.join(", ")}`
    );
    let response;
    try {
      response = await fetch(urlToFetch, {
        method: "POST",
        body: JSON.stringify(args.inputData || {}),
        headers
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch from ${urlToFetch}: ${error.message}`
      );
    }
    const json = await this.handleWorkflowServiceResponse(
      "Execute",
      args.definitionId,
      urlToFetch,
      response,
      "POST"
    );
    if (json.id) {
      this.logger.debug(
        `Execute workflow successful. Response: ${JSON.stringify(json)}`
      );
      return json;
    }
    this.logger.error(
      `Execute workflow did not return a workflow instance ID. Response: ${JSON.stringify(
        json
      )}`
    );
    throw new Error("Execute workflow did not return a workflow instance ID");
  }
  addAuthHeaders(headers, authTokens, backstageToken) {
    if (authTokens && Array.isArray(authTokens)) {
      authTokens.forEach((tokenObj) => {
        if (tokenObj.provider && tokenObj.token) {
          const headerKey = `X-Authorization-${capitalize__default.default(tokenObj.provider)}`;
          headers[headerKey] = String(tokenObj.token);
        }
      });
    } else {
      this.logger.debug(
        "No authTokens provided or authTokens is not an array."
      );
    }
    if (backstageToken) {
      const headerKey = "X-Authorization-Backstage";
      headers[headerKey] = backstageToken;
    }
  }
  async retriggerInstance(args) {
    const headers = {
      "Content-Type": "application/json"
    };
    this.addAuthHeaders(headers, args.authTokens, args.backstageToken);
    const headerKeys = Object.keys(headers);
    this.logger.info(
      `Retriggering workflow ${args.definitionId} with headers: ${headerKeys.join(", ")}`
    );
    const urlToFetch = `${args.serviceUrl}/management/processes/${args.definitionId}/instances/${args.instanceId}/retrigger`;
    let response;
    try {
      response = await fetch(urlToFetch, {
        method: "POST",
        headers
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch from ${urlToFetch}: ${error.message}`
      );
    }
    await this.handleWorkflowServiceResponse(
      "Retrigger",
      args.definitionId,
      urlToFetch,
      response,
      "POST"
    );
    return true;
  }
  async abortInstance(args) {
    const urlToFetch = `${args.serviceUrl}/management/processes/${args.definitionId}/instances/${args.instanceId}`;
    let response;
    try {
      response = await fetch(urlToFetch, {
        method: "DELETE"
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch from ${urlToFetch}: ${error.message}`
      );
    }
    await this.handleWorkflowServiceResponse(
      "Abort",
      args.definitionId,
      urlToFetch,
      response,
      "DELETE"
    );
  }
  async fetchWorkflowOverview(definitionId) {
    const source = await this.dataIndexService.fetchWorkflowSource(definitionId);
    if (!source) {
      this.logger.debug(`Workflow source not found: ${definitionId}`);
      return void 0;
    }
    return await this.fetchWorkflowOverviewBySource(source);
  }
  async fetchWorkflowOverviewBySource(source, targetEntity) {
    let lastTriggered = /* @__PURE__ */ new Date(0);
    let lastRunStatus;
    let lastRunId;
    const definition = backstagePluginOrchestratorCommon.fromWorkflowSource(source);
    const processInstances = await this.dataIndexService.fetchInstancesByDefinitionId({
      definitionId: definition.id,
      limit: 1,
      offset: 0,
      targetEntity
    });
    const pInstance = processInstances[0];
    if (pInstance?.start) {
      lastRunId = pInstance.id;
      lastTriggered = new Date(pInstance.start);
      lastRunStatus = pInstance.state;
    }
    return {
      workflowId: definition.id,
      name: definition.name,
      format: backstagePluginOrchestratorCommon.extractWorkflowFormat(source),
      lastRunId,
      lastTriggeredMs: lastTriggered.getTime(),
      lastRunStatus,
      description: definition.description
    };
  }
  async pingWorkflowService(args) {
    const urlToFetch = `${args.serviceUrl}/management/processes/${args.definitionId}`;
    let response;
    try {
      response = await fetch(urlToFetch);
    } catch (error) {
      this.logger.error(
        `Failed to fetch from ${urlToFetch}: ${error.message}`
      );
      return false;
    }
    return response.ok;
  }
  async handleWorkflowServiceResponse(operation, workflowId, urlToFetch, response, httpMethod) {
    const logErrorPrefix = `Error during operation '${operation}' on workflow ${workflowId} with service URL ${urlToFetch}`;
    if (!response) {
      throw new Error(`${logErrorPrefix} : fetch failed`);
    }
    const errorLines = [];
    errorLines.push(`HTTP ${httpMethod} request to ${urlToFetch} failed.`);
    errorLines.push(`Status Code: ${response.status}`);
    if (response.statusText) {
      errorLines.push(`Status Text: ${response.statusText}`);
    }
    try {
      const jsonResponse = await response.json();
      if (jsonResponse.id && operation === "Execute" || response.ok) {
        return jsonResponse;
      }
      if (jsonResponse?.message) {
        errorLines.push(`Message: ${jsonResponse.message}`);
      }
      if (jsonResponse?.details) {
        errorLines.push(`Details: ${jsonResponse.details}`);
      }
      if (jsonResponse?.stack) {
        errorLines.push(`Stack Trace: ${jsonResponse.stack}`);
      }
      if (jsonResponse?.failedNodeId) {
        errorLines.push(`Failed Node ID: ${jsonResponse.failedNodeId}`);
      }
      this.logger.error(`${logErrorPrefix}: ${JSON.stringify(jsonResponse)}`);
    } catch (jsonParseError) {
      this.logger.error(
        `${logErrorPrefix}. The details of this error cannot be provided because the response body was not in a parsable format.`
      );
    }
    throw new Error(errorLines.join("\n"));
  }
}

exports.SonataFlowService = SonataFlowService;
//# sourceMappingURL=SonataFlowService.cjs.js.map

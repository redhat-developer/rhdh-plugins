'use strict';

var moment = require('moment');
var backstagePluginOrchestratorCommon = require('@redhat/backstage-plugin-orchestrator-common');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e : { default: e }; }

var moment__default = /*#__PURE__*/_interopDefaultCompat(moment);

function mapToWorkflowOverviewDTO(overview) {
  return {
    name: overview.name,
    format: overview.format,
    workflowId: overview.workflowId,
    description: overview.description,
    lastRunId: overview.lastRunId,
    lastRunStatus: overview.lastRunStatus ? getProcessInstancesStatusDTOFromString(overview.lastRunStatus) : void 0,
    lastTriggeredMs: overview.lastTriggeredMs,
    isAvailable: overview.isAvailable
  };
}
function getWorkflowFormatDTO(source) {
  return backstagePluginOrchestratorCommon.extractWorkflowFormat(source);
}
function mapToWorkflowDTO(source) {
  const definition = backstagePluginOrchestratorCommon.fromWorkflowSource(source);
  return {
    annotations: definition.annotations,
    description: definition.description,
    name: definition.name,
    format: getWorkflowFormatDTO(source),
    id: definition.id
  };
}
function getProcessInstancesStatusDTOFromString(state) {
  if (!Object.values(backstagePluginOrchestratorCommon.ProcessInstanceStatusDTO).includes(
    state
  )) {
    throw new Error(
      `state ${state} is not one of the values of type ProcessInstanceStatusDTO`
    );
  }
  return state;
}
function mapToProcessInstanceDTO(processInstance) {
  const start = moment__default.default(processInstance.start);
  const end = moment__default.default(processInstance.end);
  const duration = processInstance.end ? moment__default.default.duration(start.diff(end)).humanize() : void 0;
  let variables;
  if (typeof processInstance?.variables === "string") {
    variables = JSON.parse(processInstance?.variables);
  } else {
    variables = processInstance?.variables;
  }
  return {
    id: processInstance.id,
    processId: processInstance.processId,
    processName: processInstance.processName,
    description: processInstance.description,
    serviceUrl: processInstance.serviceUrl,
    executionSummary: processInstance.executionSummary,
    endpoint: processInstance.endpoint,
    error: processInstance.error,
    start: processInstance.start,
    end: processInstance.end,
    duration,
    // @ts-ignore
    workflowdata: variables?.workflowdata,
    initiatorEntity: variables?.initiatorEntity,
    targetEntity: variables?.targetEntity,
    state: processInstance.state ? getProcessInstancesStatusDTOFromString(processInstance.state) : void 0,
    nodes: processInstance.nodes.map(mapToNodeInstanceDTO)
  };
}
function mapToNodeInstanceDTO(nodeInstance) {
  return { ...nodeInstance, __typename: "NodeInstance" };
}
function mapToExecuteWorkflowResponseDTO(workflowId, workflowExecutionResponse) {
  if (!workflowExecutionResponse?.id) {
    throw new Error(
      `Error while mapping ExecuteWorkflowResponse to ExecuteWorkflowResponseDTO for workflow with id ${workflowId}`
    );
  }
  return {
    id: workflowExecutionResponse.id
  };
}
function mapToWorkflowRunStatusDTO(status) {
  return {
    key: backstagePluginOrchestratorCommon.capitalize(status),
    value: status
  };
}

exports.getProcessInstancesStatusDTOFromString = getProcessInstancesStatusDTOFromString;
exports.getWorkflowFormatDTO = getWorkflowFormatDTO;
exports.mapToExecuteWorkflowResponseDTO = mapToExecuteWorkflowResponseDTO;
exports.mapToNodeInstanceDTO = mapToNodeInstanceDTO;
exports.mapToProcessInstanceDTO = mapToProcessInstanceDTO;
exports.mapToWorkflowDTO = mapToWorkflowDTO;
exports.mapToWorkflowOverviewDTO = mapToWorkflowOverviewDTO;
exports.mapToWorkflowRunStatusDTO = mapToWorkflowRunStatusDTO;
//# sourceMappingURL=V2Mappings.cjs.js.map

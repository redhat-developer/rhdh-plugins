'use strict';

var globalAxios = require('axios');
var common = require('./common.cjs.js');
var base = require('./base.cjs.js');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e : { default: e }; }

var globalAxios__default = /*#__PURE__*/_interopDefaultCompat(globalAxios);

const FieldFilterOperatorEnum = {
  Eq: "EQ",
  Gt: "GT",
  Gte: "GTE",
  Lt: "LT",
  Lte: "LTE",
  In: "IN",
  IsNull: "IS_NULL",
  Like: "LIKE",
  Between: "BETWEEN"
};
const LogicalFilterOperatorEnum = {
  And: "AND",
  Or: "OR",
  Not: "NOT"
};
const PaginationInfoDTOOrderDirectionEnum = {
  Asc: "ASC",
  Desc: "DESC"
};
const ProcessInstanceStatusDTO = {
  Active: "ACTIVE",
  Error: "ERROR",
  Completed: "COMPLETED",
  Aborted: "ABORTED",
  Suspended: "SUSPENDED",
  Pending: "PENDING"
};
const WorkflowFormatDTO = {
  Yaml: "yaml",
  Json: "json"
};
const WorkflowResultDTOOutputsInnerFormatEnum = {
  Text: "text",
  Number: "number",
  Link: "link",
  Markdown: "markdown"
};
const DefaultApiAxiosParamCreator = function(configuration) {
  return {
    /**
     * Aborts a workflow instance identified by the provided instanceId.
     * @summary Abort a workflow instance
     * @param {string} instanceId The identifier of the workflow instance to abort.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    abortWorkflow: async (instanceId, options = {}) => {
      common.assertParamExists("abortWorkflow", "instanceId", instanceId);
      const localVarPath = `/v2/workflows/instances/{instanceId}/abort`.replace(`{${"instanceId"}}`, encodeURIComponent(String(instanceId)));
      const localVarUrlObj = new URL(localVarPath, common.DUMMY_BASE_URL);
      let baseOptions;
      if (configuration) {
        baseOptions = configuration.baseOptions;
      }
      const localVarRequestOptions = { method: "DELETE", ...baseOptions, ...options };
      const localVarHeaderParameter = {};
      const localVarQueryParameter = {};
      common.setSearchParams(localVarUrlObj, localVarQueryParameter);
      let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
      localVarRequestOptions.headers = { ...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers };
      return {
        url: common.toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * Execute a workflow
     * @summary Execute a workflow
     * @param {string} workflowId ID of the workflow to execute
     * @param {ExecuteWorkflowRequestDTO} executeWorkflowRequestDTO 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    executeWorkflow: async (workflowId, executeWorkflowRequestDTO, options = {}) => {
      common.assertParamExists("executeWorkflow", "workflowId", workflowId);
      common.assertParamExists("executeWorkflow", "executeWorkflowRequestDTO", executeWorkflowRequestDTO);
      const localVarPath = `/v2/workflows/{workflowId}/execute`.replace(`{${"workflowId"}}`, encodeURIComponent(String(workflowId)));
      const localVarUrlObj = new URL(localVarPath, common.DUMMY_BASE_URL);
      let baseOptions;
      if (configuration) {
        baseOptions = configuration.baseOptions;
      }
      const localVarRequestOptions = { method: "POST", ...baseOptions, ...options };
      const localVarHeaderParameter = {};
      const localVarQueryParameter = {};
      localVarHeaderParameter["Content-Type"] = "application/json";
      common.setSearchParams(localVarUrlObj, localVarQueryParameter);
      let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
      localVarRequestOptions.headers = { ...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers };
      localVarRequestOptions.data = common.serializeDataIfNeeded(executeWorkflowRequestDTO, localVarRequestOptions, configuration);
      return {
        url: common.toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * Get a workflow execution/run (instance)
     * @summary Get Workflow Instance by ID
     * @param {string} instanceId ID of the workflow instance
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getInstanceById: async (instanceId, options = {}) => {
      common.assertParamExists("getInstanceById", "instanceId", instanceId);
      const localVarPath = `/v2/workflows/instances/{instanceId}`.replace(`{${"instanceId"}}`, encodeURIComponent(String(instanceId)));
      const localVarUrlObj = new URL(localVarPath, common.DUMMY_BASE_URL);
      let baseOptions;
      if (configuration) {
        baseOptions = configuration.baseOptions;
      }
      const localVarRequestOptions = { method: "GET", ...baseOptions, ...options };
      const localVarHeaderParameter = {};
      const localVarQueryParameter = {};
      common.setSearchParams(localVarUrlObj, localVarQueryParameter);
      let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
      localVarRequestOptions.headers = { ...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers };
      return {
        url: common.toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * Retrieve an array of workflow executions (instances)
     * @summary Get instances
     * @param {SearchRequest} [searchRequest] Parameters for retrieving instances
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getInstances: async (searchRequest, options = {}) => {
      const localVarPath = `/v2/workflows/instances`;
      const localVarUrlObj = new URL(localVarPath, common.DUMMY_BASE_URL);
      let baseOptions;
      if (configuration) {
        baseOptions = configuration.baseOptions;
      }
      const localVarRequestOptions = { method: "POST", ...baseOptions, ...options };
      const localVarHeaderParameter = {};
      const localVarQueryParameter = {};
      localVarHeaderParameter["Content-Type"] = "application/json";
      common.setSearchParams(localVarUrlObj, localVarQueryParameter);
      let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
      localVarRequestOptions.headers = { ...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers };
      localVarRequestOptions.data = common.serializeDataIfNeeded(searchRequest, localVarRequestOptions, configuration);
      return {
        url: common.toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * Get the workflow input schema. It defines the input fields of the workflow
     * @param {string} workflowId ID of the workflow to fetch
     * @param {string} [instanceId] ID of instance
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowInputSchemaById: async (workflowId, instanceId, options = {}) => {
      common.assertParamExists("getWorkflowInputSchemaById", "workflowId", workflowId);
      const localVarPath = `/v2/workflows/{workflowId}/inputSchema`.replace(`{${"workflowId"}}`, encodeURIComponent(String(workflowId)));
      const localVarUrlObj = new URL(localVarPath, common.DUMMY_BASE_URL);
      let baseOptions;
      if (configuration) {
        baseOptions = configuration.baseOptions;
      }
      const localVarRequestOptions = { method: "GET", ...baseOptions, ...options };
      const localVarHeaderParameter = {};
      const localVarQueryParameter = {};
      if (instanceId !== void 0) {
        localVarQueryParameter["instanceId"] = instanceId;
      }
      common.setSearchParams(localVarUrlObj, localVarQueryParameter);
      let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
      localVarRequestOptions.headers = { ...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers };
      return {
        url: common.toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * Retrieve an array of workflow executions (instances) for the given workflow
     * @summary Get instances for a specific workflow
     * @param {string} workflowId ID of the workflow
     * @param {SearchRequest} [searchRequest] Parameters for retrieving workflow instances
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowInstances: async (workflowId, searchRequest, options = {}) => {
      common.assertParamExists("getWorkflowInstances", "workflowId", workflowId);
      const localVarPath = `/v2/workflows/{workflowId}/instances`.replace(`{${"workflowId"}}`, encodeURIComponent(String(workflowId)));
      const localVarUrlObj = new URL(localVarPath, common.DUMMY_BASE_URL);
      let baseOptions;
      if (configuration) {
        baseOptions = configuration.baseOptions;
      }
      const localVarRequestOptions = { method: "POST", ...baseOptions, ...options };
      const localVarHeaderParameter = {};
      const localVarQueryParameter = {};
      localVarHeaderParameter["Content-Type"] = "application/json";
      common.setSearchParams(localVarUrlObj, localVarQueryParameter);
      let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
      localVarRequestOptions.headers = { ...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers };
      localVarRequestOptions.data = common.serializeDataIfNeeded(searchRequest, localVarRequestOptions, configuration);
      return {
        url: common.toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * Returns the key fields of the workflow including data on the last run instance
     * @param {string} workflowId Unique identifier of the workflow
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowOverviewById: async (workflowId, options = {}) => {
      common.assertParamExists("getWorkflowOverviewById", "workflowId", workflowId);
      const localVarPath = `/v2/workflows/{workflowId}/overview`.replace(`{${"workflowId"}}`, encodeURIComponent(String(workflowId)));
      const localVarUrlObj = new URL(localVarPath, common.DUMMY_BASE_URL);
      let baseOptions;
      if (configuration) {
        baseOptions = configuration.baseOptions;
      }
      const localVarRequestOptions = { method: "GET", ...baseOptions, ...options };
      const localVarHeaderParameter = {};
      const localVarQueryParameter = {};
      common.setSearchParams(localVarUrlObj, localVarQueryParameter);
      let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
      localVarRequestOptions.headers = { ...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers };
      return {
        url: common.toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * Get the workflow\'s definition
     * @param {string} workflowId ID of the workflow to fetch
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowSourceById: async (workflowId, options = {}) => {
      common.assertParamExists("getWorkflowSourceById", "workflowId", workflowId);
      const localVarPath = `/v2/workflows/{workflowId}/source`.replace(`{${"workflowId"}}`, encodeURIComponent(String(workflowId)));
      const localVarUrlObj = new URL(localVarPath, common.DUMMY_BASE_URL);
      let baseOptions;
      if (configuration) {
        baseOptions = configuration.baseOptions;
      }
      const localVarRequestOptions = { method: "GET", ...baseOptions, ...options };
      const localVarHeaderParameter = {};
      const localVarQueryParameter = {};
      common.setSearchParams(localVarUrlObj, localVarQueryParameter);
      let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
      localVarRequestOptions.headers = { ...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers };
      return {
        url: common.toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * Retrieve array with the status of all instances
     * @summary Get workflow status list
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowStatuses: async (options = {}) => {
      const localVarPath = `/v2/workflows/instances/statuses`;
      const localVarUrlObj = new URL(localVarPath, common.DUMMY_BASE_URL);
      let baseOptions;
      if (configuration) {
        baseOptions = configuration.baseOptions;
      }
      const localVarRequestOptions = { method: "GET", ...baseOptions, ...options };
      const localVarHeaderParameter = {};
      const localVarQueryParameter = {};
      common.setSearchParams(localVarUrlObj, localVarQueryParameter);
      let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
      localVarRequestOptions.headers = { ...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers };
      return {
        url: common.toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * Returns the key fields of the workflow including data on the last run instance
     * @param {SearchRequest} [searchRequest] Pagination and filters
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowsOverview: async (searchRequest, options = {}) => {
      const localVarPath = `/v2/workflows/overview`;
      const localVarUrlObj = new URL(localVarPath, common.DUMMY_BASE_URL);
      let baseOptions;
      if (configuration) {
        baseOptions = configuration.baseOptions;
      }
      const localVarRequestOptions = { method: "POST", ...baseOptions, ...options };
      const localVarHeaderParameter = {};
      const localVarQueryParameter = {};
      localVarHeaderParameter["Content-Type"] = "application/json";
      common.setSearchParams(localVarUrlObj, localVarQueryParameter);
      let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
      localVarRequestOptions.headers = { ...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers };
      localVarRequestOptions.data = common.serializeDataIfNeeded(searchRequest, localVarRequestOptions, configuration);
      return {
        url: common.toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * Returns the key fields of the workflow including data on the last run instance
     * @param {GetWorkflowsOverviewForEntityRequest} [getWorkflowsOverviewForEntityRequest] Target entity reference and annotation workflow ids
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowsOverviewForEntity: async (getWorkflowsOverviewForEntityRequest, options = {}) => {
      const localVarPath = `/v2/workflows/overview/entity`;
      const localVarUrlObj = new URL(localVarPath, common.DUMMY_BASE_URL);
      let baseOptions;
      if (configuration) {
        baseOptions = configuration.baseOptions;
      }
      const localVarRequestOptions = { method: "POST", ...baseOptions, ...options };
      const localVarHeaderParameter = {};
      const localVarQueryParameter = {};
      localVarHeaderParameter["Content-Type"] = "application/json";
      common.setSearchParams(localVarUrlObj, localVarQueryParameter);
      let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
      localVarRequestOptions.headers = { ...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers };
      localVarRequestOptions.data = common.serializeDataIfNeeded(getWorkflowsOverviewForEntityRequest, localVarRequestOptions, configuration);
      return {
        url: common.toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * Returns true if the workflow service is up for the given workflow ID.
     * @param {string} workflowId ID of the workflow to fetch
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    pingWorkflowServiceById: async (workflowId, options = {}) => {
      common.assertParamExists("pingWorkflowServiceById", "workflowId", workflowId);
      const localVarPath = `/v2/workflows/{workflowId}/pingWorkflowService`.replace(`{${"workflowId"}}`, encodeURIComponent(String(workflowId)));
      const localVarUrlObj = new URL(localVarPath, common.DUMMY_BASE_URL);
      let baseOptions;
      if (configuration) {
        baseOptions = configuration.baseOptions;
      }
      const localVarRequestOptions = { method: "GET", ...baseOptions, ...options };
      const localVarHeaderParameter = {};
      const localVarQueryParameter = {};
      common.setSearchParams(localVarUrlObj, localVarQueryParameter);
      let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
      localVarRequestOptions.headers = { ...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers };
      return {
        url: common.toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * Retrigger an instance
     * @summary Retrigger an instance
     * @param {string} workflowId ID of the workflow
     * @param {string} instanceId ID of the instance to retrigger
     * @param {RetriggerInstanceRequestDTO} retriggerInstanceRequestDTO 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    retriggerInstance: async (workflowId, instanceId, retriggerInstanceRequestDTO, options = {}) => {
      common.assertParamExists("retriggerInstance", "workflowId", workflowId);
      common.assertParamExists("retriggerInstance", "instanceId", instanceId);
      common.assertParamExists("retriggerInstance", "retriggerInstanceRequestDTO", retriggerInstanceRequestDTO);
      const localVarPath = `/v2/workflows/{workflowId}/{instanceId}/retrigger`.replace(`{${"workflowId"}}`, encodeURIComponent(String(workflowId))).replace(`{${"instanceId"}}`, encodeURIComponent(String(instanceId)));
      const localVarUrlObj = new URL(localVarPath, common.DUMMY_BASE_URL);
      let baseOptions;
      if (configuration) {
        baseOptions = configuration.baseOptions;
      }
      const localVarRequestOptions = { method: "POST", ...baseOptions, ...options };
      const localVarHeaderParameter = {};
      const localVarQueryParameter = {};
      localVarHeaderParameter["Content-Type"] = "application/json";
      common.setSearchParams(localVarUrlObj, localVarQueryParameter);
      let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
      localVarRequestOptions.headers = { ...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers };
      localVarRequestOptions.data = common.serializeDataIfNeeded(retriggerInstanceRequestDTO, localVarRequestOptions, configuration);
      return {
        url: common.toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    }
  };
};
const DefaultApiFp = function(configuration) {
  const localVarAxiosParamCreator = DefaultApiAxiosParamCreator(configuration);
  return {
    /**
     * Aborts a workflow instance identified by the provided instanceId.
     * @summary Abort a workflow instance
     * @param {string} instanceId The identifier of the workflow instance to abort.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async abortWorkflow(instanceId, options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.abortWorkflow(instanceId, options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = base.operationServerMap["DefaultApi.abortWorkflow"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => common.createRequestFunction(localVarAxiosArgs, globalAxios__default.default, base.BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * Execute a workflow
     * @summary Execute a workflow
     * @param {string} workflowId ID of the workflow to execute
     * @param {ExecuteWorkflowRequestDTO} executeWorkflowRequestDTO 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async executeWorkflow(workflowId, executeWorkflowRequestDTO, options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.executeWorkflow(workflowId, executeWorkflowRequestDTO, options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = base.operationServerMap["DefaultApi.executeWorkflow"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => common.createRequestFunction(localVarAxiosArgs, globalAxios__default.default, base.BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * Get a workflow execution/run (instance)
     * @summary Get Workflow Instance by ID
     * @param {string} instanceId ID of the workflow instance
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async getInstanceById(instanceId, options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.getInstanceById(instanceId, options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = base.operationServerMap["DefaultApi.getInstanceById"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => common.createRequestFunction(localVarAxiosArgs, globalAxios__default.default, base.BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * Retrieve an array of workflow executions (instances)
     * @summary Get instances
     * @param {SearchRequest} [searchRequest] Parameters for retrieving instances
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async getInstances(searchRequest, options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.getInstances(searchRequest, options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = base.operationServerMap["DefaultApi.getInstances"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => common.createRequestFunction(localVarAxiosArgs, globalAxios__default.default, base.BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * Get the workflow input schema. It defines the input fields of the workflow
     * @param {string} workflowId ID of the workflow to fetch
     * @param {string} [instanceId] ID of instance
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async getWorkflowInputSchemaById(workflowId, instanceId, options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.getWorkflowInputSchemaById(workflowId, instanceId, options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = base.operationServerMap["DefaultApi.getWorkflowInputSchemaById"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => common.createRequestFunction(localVarAxiosArgs, globalAxios__default.default, base.BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * Retrieve an array of workflow executions (instances) for the given workflow
     * @summary Get instances for a specific workflow
     * @param {string} workflowId ID of the workflow
     * @param {SearchRequest} [searchRequest] Parameters for retrieving workflow instances
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async getWorkflowInstances(workflowId, searchRequest, options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.getWorkflowInstances(workflowId, searchRequest, options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = base.operationServerMap["DefaultApi.getWorkflowInstances"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => common.createRequestFunction(localVarAxiosArgs, globalAxios__default.default, base.BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * Returns the key fields of the workflow including data on the last run instance
     * @param {string} workflowId Unique identifier of the workflow
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async getWorkflowOverviewById(workflowId, options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.getWorkflowOverviewById(workflowId, options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = base.operationServerMap["DefaultApi.getWorkflowOverviewById"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => common.createRequestFunction(localVarAxiosArgs, globalAxios__default.default, base.BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * Get the workflow\'s definition
     * @param {string} workflowId ID of the workflow to fetch
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async getWorkflowSourceById(workflowId, options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.getWorkflowSourceById(workflowId, options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = base.operationServerMap["DefaultApi.getWorkflowSourceById"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => common.createRequestFunction(localVarAxiosArgs, globalAxios__default.default, base.BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * Retrieve array with the status of all instances
     * @summary Get workflow status list
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async getWorkflowStatuses(options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.getWorkflowStatuses(options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = base.operationServerMap["DefaultApi.getWorkflowStatuses"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => common.createRequestFunction(localVarAxiosArgs, globalAxios__default.default, base.BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * Returns the key fields of the workflow including data on the last run instance
     * @param {SearchRequest} [searchRequest] Pagination and filters
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async getWorkflowsOverview(searchRequest, options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.getWorkflowsOverview(searchRequest, options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = base.operationServerMap["DefaultApi.getWorkflowsOverview"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => common.createRequestFunction(localVarAxiosArgs, globalAxios__default.default, base.BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * Returns the key fields of the workflow including data on the last run instance
     * @param {GetWorkflowsOverviewForEntityRequest} [getWorkflowsOverviewForEntityRequest] Target entity reference and annotation workflow ids
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async getWorkflowsOverviewForEntity(getWorkflowsOverviewForEntityRequest, options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.getWorkflowsOverviewForEntity(getWorkflowsOverviewForEntityRequest, options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = base.operationServerMap["DefaultApi.getWorkflowsOverviewForEntity"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => common.createRequestFunction(localVarAxiosArgs, globalAxios__default.default, base.BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * Returns true if the workflow service is up for the given workflow ID.
     * @param {string} workflowId ID of the workflow to fetch
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async pingWorkflowServiceById(workflowId, options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.pingWorkflowServiceById(workflowId, options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = base.operationServerMap["DefaultApi.pingWorkflowServiceById"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => common.createRequestFunction(localVarAxiosArgs, globalAxios__default.default, base.BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * Retrigger an instance
     * @summary Retrigger an instance
     * @param {string} workflowId ID of the workflow
     * @param {string} instanceId ID of the instance to retrigger
     * @param {RetriggerInstanceRequestDTO} retriggerInstanceRequestDTO 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async retriggerInstance(workflowId, instanceId, retriggerInstanceRequestDTO, options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.retriggerInstance(workflowId, instanceId, retriggerInstanceRequestDTO, options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = base.operationServerMap["DefaultApi.retriggerInstance"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => common.createRequestFunction(localVarAxiosArgs, globalAxios__default.default, base.BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    }
  };
};
const DefaultApiFactory = function(configuration, basePath, axios) {
  const localVarFp = DefaultApiFp(configuration);
  return {
    /**
     * Aborts a workflow instance identified by the provided instanceId.
     * @summary Abort a workflow instance
     * @param {string} instanceId The identifier of the workflow instance to abort.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    abortWorkflow(instanceId, options) {
      return localVarFp.abortWorkflow(instanceId, options).then((request) => request(axios, basePath));
    },
    /**
     * Execute a workflow
     * @summary Execute a workflow
     * @param {string} workflowId ID of the workflow to execute
     * @param {ExecuteWorkflowRequestDTO} executeWorkflowRequestDTO 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    executeWorkflow(workflowId, executeWorkflowRequestDTO, options) {
      return localVarFp.executeWorkflow(workflowId, executeWorkflowRequestDTO, options).then((request) => request(axios, basePath));
    },
    /**
     * Get a workflow execution/run (instance)
     * @summary Get Workflow Instance by ID
     * @param {string} instanceId ID of the workflow instance
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getInstanceById(instanceId, options) {
      return localVarFp.getInstanceById(instanceId, options).then((request) => request(axios, basePath));
    },
    /**
     * Retrieve an array of workflow executions (instances)
     * @summary Get instances
     * @param {SearchRequest} [searchRequest] Parameters for retrieving instances
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getInstances(searchRequest, options) {
      return localVarFp.getInstances(searchRequest, options).then((request) => request(axios, basePath));
    },
    /**
     * Get the workflow input schema. It defines the input fields of the workflow
     * @param {string} workflowId ID of the workflow to fetch
     * @param {string} [instanceId] ID of instance
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowInputSchemaById(workflowId, instanceId, options) {
      return localVarFp.getWorkflowInputSchemaById(workflowId, instanceId, options).then((request) => request(axios, basePath));
    },
    /**
     * Retrieve an array of workflow executions (instances) for the given workflow
     * @summary Get instances for a specific workflow
     * @param {string} workflowId ID of the workflow
     * @param {SearchRequest} [searchRequest] Parameters for retrieving workflow instances
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowInstances(workflowId, searchRequest, options) {
      return localVarFp.getWorkflowInstances(workflowId, searchRequest, options).then((request) => request(axios, basePath));
    },
    /**
     * Returns the key fields of the workflow including data on the last run instance
     * @param {string} workflowId Unique identifier of the workflow
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowOverviewById(workflowId, options) {
      return localVarFp.getWorkflowOverviewById(workflowId, options).then((request) => request(axios, basePath));
    },
    /**
     * Get the workflow\'s definition
     * @param {string} workflowId ID of the workflow to fetch
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowSourceById(workflowId, options) {
      return localVarFp.getWorkflowSourceById(workflowId, options).then((request) => request(axios, basePath));
    },
    /**
     * Retrieve array with the status of all instances
     * @summary Get workflow status list
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowStatuses(options) {
      return localVarFp.getWorkflowStatuses(options).then((request) => request(axios, basePath));
    },
    /**
     * Returns the key fields of the workflow including data on the last run instance
     * @param {SearchRequest} [searchRequest] Pagination and filters
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowsOverview(searchRequest, options) {
      return localVarFp.getWorkflowsOverview(searchRequest, options).then((request) => request(axios, basePath));
    },
    /**
     * Returns the key fields of the workflow including data on the last run instance
     * @param {GetWorkflowsOverviewForEntityRequest} [getWorkflowsOverviewForEntityRequest] Target entity reference and annotation workflow ids
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowsOverviewForEntity(getWorkflowsOverviewForEntityRequest, options) {
      return localVarFp.getWorkflowsOverviewForEntity(getWorkflowsOverviewForEntityRequest, options).then((request) => request(axios, basePath));
    },
    /**
     * Returns true if the workflow service is up for the given workflow ID.
     * @param {string} workflowId ID of the workflow to fetch
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    pingWorkflowServiceById(workflowId, options) {
      return localVarFp.pingWorkflowServiceById(workflowId, options).then((request) => request(axios, basePath));
    },
    /**
     * Retrigger an instance
     * @summary Retrigger an instance
     * @param {string} workflowId ID of the workflow
     * @param {string} instanceId ID of the instance to retrigger
     * @param {RetriggerInstanceRequestDTO} retriggerInstanceRequestDTO 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    retriggerInstance(workflowId, instanceId, retriggerInstanceRequestDTO, options) {
      return localVarFp.retriggerInstance(workflowId, instanceId, retriggerInstanceRequestDTO, options).then((request) => request(axios, basePath));
    }
  };
};
class DefaultApi extends base.BaseAPI {
  /**
   * Aborts a workflow instance identified by the provided instanceId.
   * @summary Abort a workflow instance
   * @param {string} instanceId The identifier of the workflow instance to abort.
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DefaultApi
   */
  abortWorkflow(instanceId, options) {
    return DefaultApiFp(this.configuration).abortWorkflow(instanceId, options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * Execute a workflow
   * @summary Execute a workflow
   * @param {string} workflowId ID of the workflow to execute
   * @param {ExecuteWorkflowRequestDTO} executeWorkflowRequestDTO 
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DefaultApi
   */
  executeWorkflow(workflowId, executeWorkflowRequestDTO, options) {
    return DefaultApiFp(this.configuration).executeWorkflow(workflowId, executeWorkflowRequestDTO, options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * Get a workflow execution/run (instance)
   * @summary Get Workflow Instance by ID
   * @param {string} instanceId ID of the workflow instance
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DefaultApi
   */
  getInstanceById(instanceId, options) {
    return DefaultApiFp(this.configuration).getInstanceById(instanceId, options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * Retrieve an array of workflow executions (instances)
   * @summary Get instances
   * @param {SearchRequest} [searchRequest] Parameters for retrieving instances
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DefaultApi
   */
  getInstances(searchRequest, options) {
    return DefaultApiFp(this.configuration).getInstances(searchRequest, options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * Get the workflow input schema. It defines the input fields of the workflow
   * @param {string} workflowId ID of the workflow to fetch
   * @param {string} [instanceId] ID of instance
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DefaultApi
   */
  getWorkflowInputSchemaById(workflowId, instanceId, options) {
    return DefaultApiFp(this.configuration).getWorkflowInputSchemaById(workflowId, instanceId, options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * Retrieve an array of workflow executions (instances) for the given workflow
   * @summary Get instances for a specific workflow
   * @param {string} workflowId ID of the workflow
   * @param {SearchRequest} [searchRequest] Parameters for retrieving workflow instances
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DefaultApi
   */
  getWorkflowInstances(workflowId, searchRequest, options) {
    return DefaultApiFp(this.configuration).getWorkflowInstances(workflowId, searchRequest, options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * Returns the key fields of the workflow including data on the last run instance
   * @param {string} workflowId Unique identifier of the workflow
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DefaultApi
   */
  getWorkflowOverviewById(workflowId, options) {
    return DefaultApiFp(this.configuration).getWorkflowOverviewById(workflowId, options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * Get the workflow\'s definition
   * @param {string} workflowId ID of the workflow to fetch
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DefaultApi
   */
  getWorkflowSourceById(workflowId, options) {
    return DefaultApiFp(this.configuration).getWorkflowSourceById(workflowId, options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * Retrieve array with the status of all instances
   * @summary Get workflow status list
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DefaultApi
   */
  getWorkflowStatuses(options) {
    return DefaultApiFp(this.configuration).getWorkflowStatuses(options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * Returns the key fields of the workflow including data on the last run instance
   * @param {SearchRequest} [searchRequest] Pagination and filters
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DefaultApi
   */
  getWorkflowsOverview(searchRequest, options) {
    return DefaultApiFp(this.configuration).getWorkflowsOverview(searchRequest, options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * Returns the key fields of the workflow including data on the last run instance
   * @param {GetWorkflowsOverviewForEntityRequest} [getWorkflowsOverviewForEntityRequest] Target entity reference and annotation workflow ids
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DefaultApi
   */
  getWorkflowsOverviewForEntity(getWorkflowsOverviewForEntityRequest, options) {
    return DefaultApiFp(this.configuration).getWorkflowsOverviewForEntity(getWorkflowsOverviewForEntityRequest, options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * Returns true if the workflow service is up for the given workflow ID.
   * @param {string} workflowId ID of the workflow to fetch
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DefaultApi
   */
  pingWorkflowServiceById(workflowId, options) {
    return DefaultApiFp(this.configuration).pingWorkflowServiceById(workflowId, options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * Retrigger an instance
   * @summary Retrigger an instance
   * @param {string} workflowId ID of the workflow
   * @param {string} instanceId ID of the instance to retrigger
   * @param {RetriggerInstanceRequestDTO} retriggerInstanceRequestDTO 
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DefaultApi
   */
  retriggerInstance(workflowId, instanceId, retriggerInstanceRequestDTO, options) {
    return DefaultApiFp(this.configuration).retriggerInstance(workflowId, instanceId, retriggerInstanceRequestDTO, options).then((request) => request(this.axios, this.basePath));
  }
}

exports.DefaultApi = DefaultApi;
exports.DefaultApiAxiosParamCreator = DefaultApiAxiosParamCreator;
exports.DefaultApiFactory = DefaultApiFactory;
exports.DefaultApiFp = DefaultApiFp;
exports.FieldFilterOperatorEnum = FieldFilterOperatorEnum;
exports.LogicalFilterOperatorEnum = LogicalFilterOperatorEnum;
exports.PaginationInfoDTOOrderDirectionEnum = PaginationInfoDTOOrderDirectionEnum;
exports.ProcessInstanceStatusDTO = ProcessInstanceStatusDTO;
exports.WorkflowFormatDTO = WorkflowFormatDTO;
exports.WorkflowResultDTOOutputsInnerFormatEnum = WorkflowResultDTOOutputsInnerFormatEnum;
//# sourceMappingURL=api.cjs.js.map

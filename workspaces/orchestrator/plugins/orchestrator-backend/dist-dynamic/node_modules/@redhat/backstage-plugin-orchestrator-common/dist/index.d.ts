import { JsonObject, JsonValue } from '@backstage/types';
import { Specification } from '@severlessworkflow/sdk-typescript';
import { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import * as axios from 'axios';
import { RawAxiosRequestConfig, AxiosInstance, AxiosPromise } from 'axios';
import * as _backstage_plugin_permission_common from '@backstage/plugin-permission-common';
import { OAuthScope } from '@backstage/core-plugin-api';

declare enum ProcessInstanceState {
    Active = "ACTIVE",
    Completed = "COMPLETED",
    Aborted = "ABORTED",
    Suspended = "SUSPENDED",
    Error = "ERROR",
    Pending = "PENDING"
}
type ProcessInstanceStateValues = Uppercase<keyof typeof ProcessInstanceState>;
declare enum MilestoneStatus {
    Available = "AVAILABLE",
    Active = "ACTIVE",
    Completed = "COMPLETED"
}
interface NodeInstance {
    __typename?: 'NodeInstance';
    id: string;
    name: string;
    type: string;
    enter: string;
    exit?: string;
    definitionId: string;
    nodeId: string;
    errorMessage: string;
    retrigger: boolean;
}
interface TriggerableNode {
    id: number;
    name: string;
    type: string;
    uniqueId: string;
    nodeDefinitionId: string;
}
interface Milestone {
    __typename?: 'Milestone';
    id: string;
    name: string;
    status: MilestoneStatus;
}
interface ProcessInstanceError {
    __typename?: 'ProcessInstanceError';
    nodeDefinitionId: string;
    nodeInstanceId: string;
    message?: string;
}
type ProcessInstanceVariables = Record<string, unknown>;
interface ProcessInstance {
    id: string;
    processId: string;
    processName?: string;
    parentProcessInstanceId?: string;
    rootProcessInstanceId?: string;
    rootProcessId?: string;
    roles?: string[];
    state?: ProcessInstanceStateValues;
    endpoint: string;
    serviceUrl?: string;
    nodes: NodeInstance[];
    milestones?: Milestone[];
    variables?: ProcessInstanceVariables | string;
    /** Format: date-time */
    start?: string;
    /** Format: date-time */
    end?: string;
    parentProcessInstance?: ProcessInstance;
    childProcessInstances?: ProcessInstance[];
    error?: ProcessInstanceError;
    addons?: string[];
    executionSummary?: string[];
    isSelected?: boolean;
    errorMessage?: string;
    isOpen?: boolean;
    diagram?: string;
    nodeDefinitions?: TriggerableNode[];
    source?: string;
    description?: WorkflowDefinition['description'];
}
interface IntrospectionQuery {
    __type: IntrospectionType | null;
}
interface IntrospectionType {
    name: string;
    kind: TypeKind;
    description: string | null;
    fields: IntrospectionField[] | null;
}
interface IntrospectionField {
    name: string;
    type: IntrospectionTypeRef;
}
interface IntrospectionTypeRef {
    kind: TypeKind;
    name: TypeName;
    ofType: IntrospectionTypeRef | null;
}
declare enum TypeKind {
    InputObject = "INPUT_OBJECT"
}
declare enum TypeName {
    Id = "IdArgument",
    String = "StringArgument",
    Date = "DateArgument"
}

type Id<T> = {
    [P in keyof T]: T[P];
};
type OmitDistributive<T, K extends PropertyKey> = T extends any ? T extends object ? Id<OmitRecursively<T, K>> : T : never;
type OmitRecursively<T, K extends PropertyKey> = Omit<{
    [P in keyof T]: OmitDistributive<T[P], K>;
}, K>;
type WorkflowDefinition = OmitRecursively<Specification.Workflow, 'normalize'>;
type WorkflowListResult = {
    items: WorkflowDefinition[];
    offset: number;
    limit: number;
};
type WorkflowOverviewListResult = {
    items: WorkflowOverview[];
    offset: number;
    limit: number;
};
type WorkflowFormat = 'yaml' | 'json';
type WorkflowInputSchemaStep = {
    schema: JsonObjectSchema;
    title: string;
    key: string;
    data: JsonObject;
    readonlyKeys: string[];
};
type JsonObjectSchema = Omit<JSONSchema7, 'properties'> & {
    properties: {
        [key: string]: JSONSchema7;
    };
};
type ComposedSchema = Omit<JSONSchema7, 'properties'> & {
    properties: {
        [key: string]: Omit<JSONSchema7, 'properties'> & {
            properties: {
                [key: string]: JsonObjectSchema;
            };
        };
    };
};
declare const isJsonObjectSchema: (schema: JSONSchema7 | JsonObjectSchema | JSONSchema7Definition) => schema is JsonObjectSchema;
declare const isComposedSchema: (schema: JSONSchema7 | ComposedSchema) => schema is ComposedSchema;
interface WorkflowExecutionResponse {
    id: string;
}
interface WorkflowOverview {
    workflowId: string;
    format: WorkflowFormat;
    name?: string;
    lastRunId?: string;
    lastTriggeredMs?: number;
    lastRunStatus?: ProcessInstanceStateValues;
    avgDurationMs?: number;
    description?: string;
    isAvailable?: boolean;
}
interface WorkflowInfo {
    id: string;
    type?: string;
    name?: string;
    version?: string;
    annotations?: string[];
    description?: string;
    inputSchema?: JSONSchema7;
    endpoint?: string;
    serviceUrl?: string;
    roles?: string[];
    source?: string;
    metadata?: Record<string, string>;
    nodes?: Node[];
}
interface Node {
    id: string;
    type?: string;
    name?: string;
    uniqueId?: string;
    nodeDefinitionId?: string;
}

declare const openApiDocument: any;

/**
 * Orchestrator plugin
 * API to interact with orchestrator plugin
 *
 * The version of the OpenAPI document: 0.0.1
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
interface ConfigurationParameters {
    apiKey?: string | Promise<string> | ((name: string) => string) | ((name: string) => Promise<string>);
    username?: string;
    password?: string;
    accessToken?: string | Promise<string> | ((name?: string, scopes?: string[]) => string) | ((name?: string, scopes?: string[]) => Promise<string>);
    basePath?: string;
    serverIndex?: number;
    baseOptions?: any;
    formDataCtor?: new () => any;
}
declare class Configuration {
    /**
     * parameter for apiKey security
     * @param name security name
     * @memberof Configuration
     */
    apiKey?: string | Promise<string> | ((name: string) => string) | ((name: string) => Promise<string>);
    /**
     * parameter for basic security
     *
     * @type {string}
     * @memberof Configuration
     */
    username?: string;
    /**
     * parameter for basic security
     *
     * @type {string}
     * @memberof Configuration
     */
    password?: string;
    /**
     * parameter for oauth2 security
     * @param name security name
     * @param scopes oauth2 scope
     * @memberof Configuration
     */
    accessToken?: string | Promise<string> | ((name?: string, scopes?: string[]) => string) | ((name?: string, scopes?: string[]) => Promise<string>);
    /**
     * override base path
     *
     * @type {string}
     * @memberof Configuration
     */
    basePath?: string;
    /**
     * override server index
     *
     * @type {number}
     * @memberof Configuration
     */
    serverIndex?: number;
    /**
     * base options for axios calls
     *
     * @type {any}
     * @memberof Configuration
     */
    baseOptions?: any;
    /**
     * The FormData constructor that will be used to create multipart form data
     * requests. You can inject this here so that execution environments that
     * do not support the FormData class can still run the generated client.
     *
     * @type {new () => FormData}
     */
    formDataCtor?: new () => any;
    constructor(param?: ConfigurationParameters);
    /**
     * Check if the given MIME is a JSON MIME.
     * JSON MIME examples:
     *   application/json
     *   application/json; charset=UTF8
     *   APPLICATION/JSON
     *   application/vnd.company+json
     * @param mime - MIME (Multipurpose Internet Mail Extensions)
     * @return True if the given MIME is JSON, false otherwise.
     */
    isJsonMime(mime: string): boolean;
}

/**
 * Orchestrator plugin
 * API to interact with orchestrator plugin
 *
 * The version of the OpenAPI document: 0.0.1
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 *
 * @export
 * @interface RequestArgs
 */
interface RequestArgs {
    url: string;
    options: RawAxiosRequestConfig;
}
/**
 *
 * @export
 * @class BaseAPI
 */
declare class BaseAPI {
    protected basePath: string;
    protected axios: AxiosInstance;
    protected configuration: Configuration | undefined;
    constructor(configuration?: Configuration, basePath?: string, axios?: AxiosInstance);
}

/**
 *
 * @export
 * @interface AuthToken
 */
interface AuthToken {
    /**
     * The auth token provider name
     * @type {string}
     * @memberof AuthToken
     */
    'provider': string;
    /**
     * The auth token itself retrieved from the above specified provider name
     * @type {string}
     * @memberof AuthToken
     */
    'token': string;
}
/**
 * The ErrorResponse object represents a common structure for handling errors in API responses. It includes essential information about the error, such as the error message and additional optional details.
 * @export
 * @interface ErrorResponse
 */
interface ErrorResponse {
    /**
     * A string providing a concise and human-readable description of the encountered error. This field is required in the ErrorResponse object.
     * @type {string}
     * @memberof ErrorResponse
     */
    'message': string;
    /**
     * An optional field that can contain additional information or context about the error. It provides flexibility for including extra details based on specific error scenarios.
     * @type {string}
     * @memberof ErrorResponse
     */
    'additionalInfo'?: string;
}
/**
 *
 * @export
 * @interface ExecuteWorkflowRequestDTO
 */
interface ExecuteWorkflowRequestDTO {
    /**
     *
     * @type {object}
     * @memberof ExecuteWorkflowRequestDTO
     */
    'inputData'?: object;
    /**
     *
     * @type {Array<AuthToken>}
     * @memberof ExecuteWorkflowRequestDTO
     */
    'authTokens'?: Array<AuthToken>;
    /**
     * The entity string identifier to execute the workflow for
     * @type {string}
     * @memberof ExecuteWorkflowRequestDTO
     */
    'targetEntity'?: string;
}
/**
 *
 * @export
 * @interface ExecuteWorkflowResponseDTO
 */
interface ExecuteWorkflowResponseDTO {
    /**
     *
     * @type {string}
     * @memberof ExecuteWorkflowResponseDTO
     */
    'id': string;
}
/**
 *
 * @export
 * @interface FieldFilter
 */
interface FieldFilter {
    /**
     *
     * @type {string}
     * @memberof FieldFilter
     */
    'field': string;
    /**
     *
     * @type {string}
     * @memberof FieldFilter
     */
    'operator': FieldFilterOperatorEnum;
    /**
     *
     * @type {FieldFilterValue}
     * @memberof FieldFilter
     */
    'value': FieldFilterValue;
}
declare const FieldFilterOperatorEnum: {
    readonly Eq: "EQ";
    readonly Gt: "GT";
    readonly Gte: "GTE";
    readonly Lt: "LT";
    readonly Lte: "LTE";
    readonly In: "IN";
    readonly IsNull: "IS_NULL";
    readonly Like: "LIKE";
    readonly Between: "BETWEEN";
};
type FieldFilterOperatorEnum = typeof FieldFilterOperatorEnum[keyof typeof FieldFilterOperatorEnum];
/**
 * @type FieldFilterValue
 * @export
 */
type FieldFilterValue = any | boolean | number | string;
/**
 * @type Filter
 * @export
 */
type Filter = FieldFilter | LogicalFilter | NestedFilter;
/**
 *
 * @export
 * @interface GetOverviewsRequestParams
 */
interface GetOverviewsRequestParams {
    /**
     *
     * @type {PaginationInfoDTO}
     * @memberof GetOverviewsRequestParams
     */
    'paginationInfo'?: PaginationInfoDTO;
    /**
     *
     * @type {SearchRequest}
     * @memberof GetOverviewsRequestParams
     */
    'filters'?: SearchRequest;
}
/**
 *
 * @export
 * @interface GetWorkflowsOverviewForEntityRequest
 */
interface GetWorkflowsOverviewForEntityRequest {
    /**
     *
     * @type {string}
     * @memberof GetWorkflowsOverviewForEntityRequest
     */
    'targetEntity'?: string;
    /**
     *
     * @type {Array<string>}
     * @memberof GetWorkflowsOverviewForEntityRequest
     */
    'annotationWorkflowIds'?: Array<string>;
}
/**
 *
 * @export
 * @interface InputSchemaResponseDTO
 */
interface InputSchemaResponseDTO {
    /**
     *
     * @type {object}
     * @memberof InputSchemaResponseDTO
     */
    'inputSchema'?: object;
    /**
     *
     * @type {object}
     * @memberof InputSchemaResponseDTO
     */
    'data'?: object;
}
/**
 *
 * @export
 * @interface LogicalFilter
 */
interface LogicalFilter {
    /**
     *
     * @type {string}
     * @memberof LogicalFilter
     */
    'operator': LogicalFilterOperatorEnum;
    /**
     *
     * @type {Array<Filter>}
     * @memberof LogicalFilter
     */
    'filters': Array<Filter>;
}
declare const LogicalFilterOperatorEnum: {
    readonly And: "AND";
    readonly Or: "OR";
    readonly Not: "NOT";
};
type LogicalFilterOperatorEnum = typeof LogicalFilterOperatorEnum[keyof typeof LogicalFilterOperatorEnum];
/**
 *
 * @export
 * @interface NestedFilter
 */
interface NestedFilter {
    /**
     *
     * @type {string}
     * @memberof NestedFilter
     */
    'field': string;
    /**
     *
     * @type {NestedFilterNested}
     * @memberof NestedFilter
     */
    'nested': NestedFilterNested;
}
/**
 * @type NestedFilterNested
 * @export
 */
type NestedFilterNested = FieldFilter | NestedFilter;
/**
 *
 * @export
 * @interface NodeInstanceDTO
 */
interface NodeInstanceDTO {
    /**
     * Type name
     * @type {string}
     * @memberof NodeInstanceDTO
     */
    '__typename'?: string;
    /**
     * Node instance ID
     * @type {string}
     * @memberof NodeInstanceDTO
     */
    'id': string;
    /**
     * Node name
     * @type {string}
     * @memberof NodeInstanceDTO
     */
    'name'?: string;
    /**
     * Node type
     * @type {string}
     * @memberof NodeInstanceDTO
     */
    'type'?: string;
    /**
     * Date when the node was entered
     * @type {string}
     * @memberof NodeInstanceDTO
     */
    'enter'?: string;
    /**
     * Date when the node was exited (optional)
     * @type {string}
     * @memberof NodeInstanceDTO
     */
    'exit'?: string;
    /**
     * Definition ID
     * @type {string}
     * @memberof NodeInstanceDTO
     */
    'definitionId'?: string;
    /**
     * Node ID
     * @type {string}
     * @memberof NodeInstanceDTO
     */
    'nodeId'?: string;
}
/**
 *
 * @export
 * @interface PaginationInfoDTO
 */
interface PaginationInfoDTO {
    /**
     *
     * @type {number}
     * @memberof PaginationInfoDTO
     */
    'pageSize'?: number;
    /**
     *
     * @type {number}
     * @memberof PaginationInfoDTO
     */
    'offset'?: number;
    /**
     *
     * @type {string}
     * @memberof PaginationInfoDTO
     */
    'orderDirection'?: PaginationInfoDTOOrderDirectionEnum;
    /**
     *
     * @type {string}
     * @memberof PaginationInfoDTO
     */
    'orderBy'?: string;
}
declare const PaginationInfoDTOOrderDirectionEnum: {
    readonly Asc: "ASC";
    readonly Desc: "DESC";
};
type PaginationInfoDTOOrderDirectionEnum = typeof PaginationInfoDTOOrderDirectionEnum[keyof typeof PaginationInfoDTOOrderDirectionEnum];
/**
 *
 * @export
 * @interface ProcessInstanceDTO
 */
interface ProcessInstanceDTO {
    /**
     *
     * @type {string}
     * @memberof ProcessInstanceDTO
     */
    'id': string;
    /**
     *
     * @type {string}
     * @memberof ProcessInstanceDTO
     */
    'processId': string;
    /**
     *
     * @type {string}
     * @memberof ProcessInstanceDTO
     */
    'processName'?: string;
    /**
     *
     * @type {ProcessInstanceStatusDTO}
     * @memberof ProcessInstanceDTO
     */
    'state'?: ProcessInstanceStatusDTO;
    /**
     *
     * @type {string}
     * @memberof ProcessInstanceDTO
     */
    'endpoint'?: string;
    /**
     *
     * @type {string}
     * @memberof ProcessInstanceDTO
     */
    'serviceUrl'?: string;
    /**
     *
     * @type {string}
     * @memberof ProcessInstanceDTO
     */
    'start'?: string;
    /**
     *
     * @type {string}
     * @memberof ProcessInstanceDTO
     */
    'end'?: string;
    /**
     *
     * @type {string}
     * @memberof ProcessInstanceDTO
     */
    'duration'?: string;
    /**
     *
     * @type {string}
     * @memberof ProcessInstanceDTO
     */
    'description'?: string;
    /**
     *
     * @type {WorkflowDataDTO}
     * @memberof ProcessInstanceDTO
     */
    'workflowdata'?: WorkflowDataDTO;
    /**
     *
     * @type {string}
     * @memberof ProcessInstanceDTO
     */
    'initiatorEntity'?: string;
    /**
     *
     * @type {string}
     * @memberof ProcessInstanceDTO
     */
    'targetEntity'?: string;
    /**
     *
     * @type {Array<string>}
     * @memberof ProcessInstanceDTO
     */
    'executionSummary'?: Array<string>;
    /**
     *
     * @type {Array<NodeInstanceDTO>}
     * @memberof ProcessInstanceDTO
     */
    'nodes': Array<NodeInstanceDTO>;
    /**
     *
     * @type {ProcessInstanceErrorDTO}
     * @memberof ProcessInstanceDTO
     */
    'error'?: ProcessInstanceErrorDTO;
}
/**
 *
 * @export
 * @interface ProcessInstanceErrorDTO
 */
interface ProcessInstanceErrorDTO {
    /**
     * Type name
     * @type {string}
     * @memberof ProcessInstanceErrorDTO
     */
    '__typename'?: string;
    /**
     * Node definition ID
     * @type {string}
     * @memberof ProcessInstanceErrorDTO
     */
    'nodeDefinitionId': string;
    /**
     * Error message (optional)
     * @type {string}
     * @memberof ProcessInstanceErrorDTO
     */
    'message'?: string;
}
/**
 *
 * @export
 * @interface ProcessInstanceListResultDTO
 */
interface ProcessInstanceListResultDTO {
    /**
     *
     * @type {Array<ProcessInstanceDTO>}
     * @memberof ProcessInstanceListResultDTO
     */
    'items'?: Array<ProcessInstanceDTO>;
    /**
     *
     * @type {PaginationInfoDTO}
     * @memberof ProcessInstanceListResultDTO
     */
    'paginationInfo'?: PaginationInfoDTO;
}
/**
 * Status of the workflow run
 * @export
 * @enum {string}
 */
declare const ProcessInstanceStatusDTO: {
    readonly Active: "ACTIVE";
    readonly Error: "ERROR";
    readonly Completed: "COMPLETED";
    readonly Aborted: "ABORTED";
    readonly Suspended: "SUSPENDED";
    readonly Pending: "PENDING";
};
type ProcessInstanceStatusDTO = typeof ProcessInstanceStatusDTO[keyof typeof ProcessInstanceStatusDTO];
/**
 *
 * @export
 * @interface RetriggerInstanceRequestDTO
 */
interface RetriggerInstanceRequestDTO {
    /**
     *
     * @type {Array<AuthToken>}
     * @memberof RetriggerInstanceRequestDTO
     */
    'authTokens'?: Array<AuthToken>;
}
/**
 *
 * @export
 * @interface SearchRequest
 */
interface SearchRequest {
    /**
     *
     * @type {Filter}
     * @memberof SearchRequest
     */
    'filters'?: Filter;
    /**
     *
     * @type {PaginationInfoDTO}
     * @memberof SearchRequest
     */
    'paginationInfo'?: PaginationInfoDTO;
}
/**
 *
 * @export
 * @interface WorkflowDTO
 */
interface WorkflowDTO {
    /**
     * Workflow unique identifier
     * @type {string}
     * @memberof WorkflowDTO
     */
    'id': string;
    /**
     * Workflow name
     * @type {string}
     * @memberof WorkflowDTO
     */
    'name'?: string;
    /**
     *
     * @type {WorkflowFormatDTO}
     * @memberof WorkflowDTO
     */
    'format': WorkflowFormatDTO;
    /**
     * Description of the workflow
     * @type {string}
     * @memberof WorkflowDTO
     */
    'description'?: string;
    /**
     *
     * @type {Array<string>}
     * @memberof WorkflowDTO
     */
    'annotations'?: Array<string>;
}
/**
 *
 * @export
 * @interface WorkflowDataDTO
 */
interface WorkflowDataDTO {
    /**
     *
     * @type {WorkflowResultDTO}
     * @memberof WorkflowDataDTO
     */
    'result'?: WorkflowResultDTO;
}
/**
 * Format of the workflow definition
 * @export
 * @enum {string}
 */
declare const WorkflowFormatDTO: {
    readonly Yaml: "yaml";
    readonly Json: "json";
};
type WorkflowFormatDTO = typeof WorkflowFormatDTO[keyof typeof WorkflowFormatDTO];
/**
 *
 * @export
 * @interface WorkflowListResultDTO
 */
interface WorkflowListResultDTO {
    /**
     *
     * @type {Array<WorkflowDTO>}
     * @memberof WorkflowListResultDTO
     */
    'items': Array<WorkflowDTO>;
    /**
     *
     * @type {PaginationInfoDTO}
     * @memberof WorkflowListResultDTO
     */
    'paginationInfo': PaginationInfoDTO;
}
/**
 *
 * @export
 * @interface WorkflowOverviewDTO
 */
interface WorkflowOverviewDTO {
    /**
     * Workflow unique identifier
     * @type {string}
     * @memberof WorkflowOverviewDTO
     */
    'workflowId': string;
    /**
     * Workflow name
     * @type {string}
     * @memberof WorkflowOverviewDTO
     */
    'name'?: string;
    /**
     *
     * @type {WorkflowFormatDTO}
     * @memberof WorkflowOverviewDTO
     */
    'format': WorkflowFormatDTO;
    /**
     *
     * @type {string}
     * @memberof WorkflowOverviewDTO
     */
    'lastRunId'?: string;
    /**
     *
     * @type {number}
     * @memberof WorkflowOverviewDTO
     */
    'lastTriggeredMs'?: number;
    /**
     *
     * @type {ProcessInstanceStatusDTO}
     * @memberof WorkflowOverviewDTO
     */
    'lastRunStatus'?: ProcessInstanceStatusDTO;
    /**
     *
     * @type {string}
     * @memberof WorkflowOverviewDTO
     */
    'description'?: string;
    /**
     *
     * @type {boolean}
     * @memberof WorkflowOverviewDTO
     */
    'isAvailable'?: boolean;
}
/**
 *
 * @export
 * @interface WorkflowOverviewListResultDTO
 */
interface WorkflowOverviewListResultDTO {
    /**
     *
     * @type {Array<WorkflowOverviewDTO>}
     * @memberof WorkflowOverviewListResultDTO
     */
    'overviews'?: Array<WorkflowOverviewDTO>;
    /**
     *
     * @type {PaginationInfoDTO}
     * @memberof WorkflowOverviewListResultDTO
     */
    'paginationInfo'?: PaginationInfoDTO;
}
/**
 *
 * @export
 * @interface WorkflowProgressDTO
 */
interface WorkflowProgressDTO {
    /**
     * Type name
     * @type {any}
     * @memberof WorkflowProgressDTO
     */
    '__typename'?: any;
    /**
     * Node instance ID
     * @type {any}
     * @memberof WorkflowProgressDTO
     */
    'id': any;
    /**
     * Node name
     * @type {any}
     * @memberof WorkflowProgressDTO
     */
    'name'?: any;
    /**
     * Node type
     * @type {any}
     * @memberof WorkflowProgressDTO
     */
    'type'?: any;
    /**
     * Date when the node was entered
     * @type {any}
     * @memberof WorkflowProgressDTO
     */
    'enter'?: any;
    /**
     * Date when the node was exited (optional)
     * @type {any}
     * @memberof WorkflowProgressDTO
     */
    'exit'?: any;
    /**
     * Definition ID
     * @type {any}
     * @memberof WorkflowProgressDTO
     */
    'definitionId'?: any;
    /**
     * Node ID
     * @type {any}
     * @memberof WorkflowProgressDTO
     */
    'nodeId'?: any;
    /**
     *
     * @type {ProcessInstanceStatusDTO}
     * @memberof WorkflowProgressDTO
     */
    'status'?: ProcessInstanceStatusDTO;
    /**
     *
     * @type {ProcessInstanceErrorDTO}
     * @memberof WorkflowProgressDTO
     */
    'error'?: ProcessInstanceErrorDTO;
}
/**
 * Result of a workflow execution
 * @export
 * @interface WorkflowResultDTO
 */
interface WorkflowResultDTO {
    /**
     * High-level summary of the current status, free-form text, human readable.
     * @type {string}
     * @memberof WorkflowResultDTO
     */
    'message'?: string;
    /**
     * List of workflows suggested to run next. Items at lower indexes are of higher priority.
     * @type {Array<WorkflowResultDTONextWorkflowsInner>}
     * @memberof WorkflowResultDTO
     */
    'nextWorkflows'?: Array<WorkflowResultDTONextWorkflowsInner>;
    /**
     * Additional structured output of workflow processing. This can contain identifiers of created resources, links to resources, logs or other output.
     * @type {Array<WorkflowResultDTOOutputsInner>}
     * @memberof WorkflowResultDTO
     */
    'outputs'?: Array<WorkflowResultDTOOutputsInner>;
}
/**
 *
 * @export
 * @interface WorkflowResultDTONextWorkflowsInner
 */
interface WorkflowResultDTONextWorkflowsInner {
    /**
     * Workflow identifier
     * @type {string}
     * @memberof WorkflowResultDTONextWorkflowsInner
     */
    'id': string;
    /**
     * Human readable title describing the workflow.
     * @type {string}
     * @memberof WorkflowResultDTONextWorkflowsInner
     */
    'name': string;
}
/**
 *
 * @export
 * @interface WorkflowResultDTOOutputsInner
 */
interface WorkflowResultDTOOutputsInner {
    /**
     * Unique identifier of the option. Preferably human-readable.
     * @type {string}
     * @memberof WorkflowResultDTOOutputsInner
     */
    'key': string;
    /**
     *
     * @type {WorkflowResultDTOOutputsInnerValue}
     * @memberof WorkflowResultDTOOutputsInner
     */
    'value': WorkflowResultDTOOutputsInnerValue;
    /**
     * More detailed type of the \'value\' property. Defaults to \'text\'.
     * @type {string}
     * @memberof WorkflowResultDTOOutputsInner
     */
    'format'?: WorkflowResultDTOOutputsInnerFormatEnum;
}
declare const WorkflowResultDTOOutputsInnerFormatEnum: {
    readonly Text: "text";
    readonly Number: "number";
    readonly Link: "link";
    readonly Markdown: "markdown";
};
type WorkflowResultDTOOutputsInnerFormatEnum = typeof WorkflowResultDTOOutputsInnerFormatEnum[keyof typeof WorkflowResultDTOOutputsInnerFormatEnum];
/**
 * Free form value of the option.
 * @export
 * @interface WorkflowResultDTOOutputsInnerValue
 */
interface WorkflowResultDTOOutputsInnerValue {
}
/**
 *
 * @export
 * @interface WorkflowRunStatusDTO
 */
interface WorkflowRunStatusDTO {
    /**
     *
     * @type {string}
     * @memberof WorkflowRunStatusDTO
     */
    'key'?: string;
    /**
     *
     * @type {string}
     * @memberof WorkflowRunStatusDTO
     */
    'value'?: string;
}
/**
 * DefaultApi - axios parameter creator
 * @export
 */
declare const DefaultApiAxiosParamCreator: (configuration?: Configuration) => {
    /**
     * Aborts a workflow instance identified by the provided instanceId.
     * @summary Abort a workflow instance
     * @param {string} instanceId The identifier of the workflow instance to abort.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    abortWorkflow: (instanceId: string, options?: RawAxiosRequestConfig) => Promise<RequestArgs>;
    /**
     * Execute a workflow
     * @summary Execute a workflow
     * @param {string} workflowId ID of the workflow to execute
     * @param {ExecuteWorkflowRequestDTO} executeWorkflowRequestDTO
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    executeWorkflow: (workflowId: string, executeWorkflowRequestDTO: ExecuteWorkflowRequestDTO, options?: RawAxiosRequestConfig) => Promise<RequestArgs>;
    /**
     * Get a workflow execution/run (instance)
     * @summary Get Workflow Instance by ID
     * @param {string} instanceId ID of the workflow instance
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getInstanceById: (instanceId: string, options?: RawAxiosRequestConfig) => Promise<RequestArgs>;
    /**
     * Retrieve an array of workflow executions (instances)
     * @summary Get instances
     * @param {SearchRequest} [searchRequest] Parameters for retrieving instances
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getInstances: (searchRequest?: SearchRequest, options?: RawAxiosRequestConfig) => Promise<RequestArgs>;
    /**
     * Get the workflow input schema. It defines the input fields of the workflow
     * @param {string} workflowId ID of the workflow to fetch
     * @param {string} [instanceId] ID of instance
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowInputSchemaById: (workflowId: string, instanceId?: string, options?: RawAxiosRequestConfig) => Promise<RequestArgs>;
    /**
     * Retrieve an array of workflow executions (instances) for the given workflow
     * @summary Get instances for a specific workflow
     * @param {string} workflowId ID of the workflow
     * @param {SearchRequest} [searchRequest] Parameters for retrieving workflow instances
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowInstances: (workflowId: string, searchRequest?: SearchRequest, options?: RawAxiosRequestConfig) => Promise<RequestArgs>;
    /**
     * Returns the key fields of the workflow including data on the last run instance
     * @param {string} workflowId Unique identifier of the workflow
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowOverviewById: (workflowId: string, options?: RawAxiosRequestConfig) => Promise<RequestArgs>;
    /**
     * Get the workflow\'s definition
     * @param {string} workflowId ID of the workflow to fetch
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowSourceById: (workflowId: string, options?: RawAxiosRequestConfig) => Promise<RequestArgs>;
    /**
     * Retrieve array with the status of all instances
     * @summary Get workflow status list
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowStatuses: (options?: RawAxiosRequestConfig) => Promise<RequestArgs>;
    /**
     * Returns the key fields of the workflow including data on the last run instance
     * @param {SearchRequest} [searchRequest] Pagination and filters
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowsOverview: (searchRequest?: SearchRequest, options?: RawAxiosRequestConfig) => Promise<RequestArgs>;
    /**
     * Returns the key fields of the workflow including data on the last run instance
     * @param {GetWorkflowsOverviewForEntityRequest} [getWorkflowsOverviewForEntityRequest] Target entity reference and annotation workflow ids
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowsOverviewForEntity: (getWorkflowsOverviewForEntityRequest?: GetWorkflowsOverviewForEntityRequest, options?: RawAxiosRequestConfig) => Promise<RequestArgs>;
    /**
     * Returns true if the workflow service is up for the given workflow ID.
     * @param {string} workflowId ID of the workflow to fetch
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    pingWorkflowServiceById: (workflowId: string, options?: RawAxiosRequestConfig) => Promise<RequestArgs>;
    /**
     * Retrigger an instance
     * @summary Retrigger an instance
     * @param {string} workflowId ID of the workflow
     * @param {string} instanceId ID of the instance to retrigger
     * @param {RetriggerInstanceRequestDTO} retriggerInstanceRequestDTO
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    retriggerInstance: (workflowId: string, instanceId: string, retriggerInstanceRequestDTO: RetriggerInstanceRequestDTO, options?: RawAxiosRequestConfig) => Promise<RequestArgs>;
};
/**
 * DefaultApi - functional programming interface
 * @export
 */
declare const DefaultApiFp: (configuration?: Configuration) => {
    /**
     * Aborts a workflow instance identified by the provided instanceId.
     * @summary Abort a workflow instance
     * @param {string} instanceId The identifier of the workflow instance to abort.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    abortWorkflow(instanceId: string, options?: RawAxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<string>>;
    /**
     * Execute a workflow
     * @summary Execute a workflow
     * @param {string} workflowId ID of the workflow to execute
     * @param {ExecuteWorkflowRequestDTO} executeWorkflowRequestDTO
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    executeWorkflow(workflowId: string, executeWorkflowRequestDTO: ExecuteWorkflowRequestDTO, options?: RawAxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<ExecuteWorkflowResponseDTO>>;
    /**
     * Get a workflow execution/run (instance)
     * @summary Get Workflow Instance by ID
     * @param {string} instanceId ID of the workflow instance
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getInstanceById(instanceId: string, options?: RawAxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<ProcessInstanceDTO>>;
    /**
     * Retrieve an array of workflow executions (instances)
     * @summary Get instances
     * @param {SearchRequest} [searchRequest] Parameters for retrieving instances
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getInstances(searchRequest?: SearchRequest, options?: RawAxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<ProcessInstanceListResultDTO>>;
    /**
     * Get the workflow input schema. It defines the input fields of the workflow
     * @param {string} workflowId ID of the workflow to fetch
     * @param {string} [instanceId] ID of instance
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowInputSchemaById(workflowId: string, instanceId?: string, options?: RawAxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<InputSchemaResponseDTO>>;
    /**
     * Retrieve an array of workflow executions (instances) for the given workflow
     * @summary Get instances for a specific workflow
     * @param {string} workflowId ID of the workflow
     * @param {SearchRequest} [searchRequest] Parameters for retrieving workflow instances
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowInstances(workflowId: string, searchRequest?: SearchRequest, options?: RawAxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<ProcessInstanceListResultDTO>>;
    /**
     * Returns the key fields of the workflow including data on the last run instance
     * @param {string} workflowId Unique identifier of the workflow
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowOverviewById(workflowId: string, options?: RawAxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<WorkflowOverviewDTO>>;
    /**
     * Get the workflow\'s definition
     * @param {string} workflowId ID of the workflow to fetch
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowSourceById(workflowId: string, options?: RawAxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<string>>;
    /**
     * Retrieve array with the status of all instances
     * @summary Get workflow status list
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowStatuses(options?: RawAxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<Array<WorkflowRunStatusDTO>>>;
    /**
     * Returns the key fields of the workflow including data on the last run instance
     * @param {SearchRequest} [searchRequest] Pagination and filters
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowsOverview(searchRequest?: SearchRequest, options?: RawAxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<WorkflowOverviewListResultDTO>>;
    /**
     * Returns the key fields of the workflow including data on the last run instance
     * @param {GetWorkflowsOverviewForEntityRequest} [getWorkflowsOverviewForEntityRequest] Target entity reference and annotation workflow ids
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowsOverviewForEntity(getWorkflowsOverviewForEntityRequest?: GetWorkflowsOverviewForEntityRequest, options?: RawAxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<WorkflowOverviewListResultDTO>>;
    /**
     * Returns true if the workflow service is up for the given workflow ID.
     * @param {string} workflowId ID of the workflow to fetch
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    pingWorkflowServiceById(workflowId: string, options?: RawAxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<boolean>>;
    /**
     * Retrigger an instance
     * @summary Retrigger an instance
     * @param {string} workflowId ID of the workflow
     * @param {string} instanceId ID of the instance to retrigger
     * @param {RetriggerInstanceRequestDTO} retriggerInstanceRequestDTO
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    retriggerInstance(workflowId: string, instanceId: string, retriggerInstanceRequestDTO: RetriggerInstanceRequestDTO, options?: RawAxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<object>>;
};
/**
 * DefaultApi - factory interface
 * @export
 */
declare const DefaultApiFactory: (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) => {
    /**
     * Aborts a workflow instance identified by the provided instanceId.
     * @summary Abort a workflow instance
     * @param {string} instanceId The identifier of the workflow instance to abort.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    abortWorkflow(instanceId: string, options?: any): AxiosPromise<string>;
    /**
     * Execute a workflow
     * @summary Execute a workflow
     * @param {string} workflowId ID of the workflow to execute
     * @param {ExecuteWorkflowRequestDTO} executeWorkflowRequestDTO
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    executeWorkflow(workflowId: string, executeWorkflowRequestDTO: ExecuteWorkflowRequestDTO, options?: any): AxiosPromise<ExecuteWorkflowResponseDTO>;
    /**
     * Get a workflow execution/run (instance)
     * @summary Get Workflow Instance by ID
     * @param {string} instanceId ID of the workflow instance
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getInstanceById(instanceId: string, options?: any): AxiosPromise<ProcessInstanceDTO>;
    /**
     * Retrieve an array of workflow executions (instances)
     * @summary Get instances
     * @param {SearchRequest} [searchRequest] Parameters for retrieving instances
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getInstances(searchRequest?: SearchRequest, options?: any): AxiosPromise<ProcessInstanceListResultDTO>;
    /**
     * Get the workflow input schema. It defines the input fields of the workflow
     * @param {string} workflowId ID of the workflow to fetch
     * @param {string} [instanceId] ID of instance
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowInputSchemaById(workflowId: string, instanceId?: string, options?: any): AxiosPromise<InputSchemaResponseDTO>;
    /**
     * Retrieve an array of workflow executions (instances) for the given workflow
     * @summary Get instances for a specific workflow
     * @param {string} workflowId ID of the workflow
     * @param {SearchRequest} [searchRequest] Parameters for retrieving workflow instances
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowInstances(workflowId: string, searchRequest?: SearchRequest, options?: any): AxiosPromise<ProcessInstanceListResultDTO>;
    /**
     * Returns the key fields of the workflow including data on the last run instance
     * @param {string} workflowId Unique identifier of the workflow
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowOverviewById(workflowId: string, options?: any): AxiosPromise<WorkflowOverviewDTO>;
    /**
     * Get the workflow\'s definition
     * @param {string} workflowId ID of the workflow to fetch
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowSourceById(workflowId: string, options?: any): AxiosPromise<string>;
    /**
     * Retrieve array with the status of all instances
     * @summary Get workflow status list
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowStatuses(options?: any): AxiosPromise<Array<WorkflowRunStatusDTO>>;
    /**
     * Returns the key fields of the workflow including data on the last run instance
     * @param {SearchRequest} [searchRequest] Pagination and filters
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowsOverview(searchRequest?: SearchRequest, options?: any): AxiosPromise<WorkflowOverviewListResultDTO>;
    /**
     * Returns the key fields of the workflow including data on the last run instance
     * @param {GetWorkflowsOverviewForEntityRequest} [getWorkflowsOverviewForEntityRequest] Target entity reference and annotation workflow ids
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getWorkflowsOverviewForEntity(getWorkflowsOverviewForEntityRequest?: GetWorkflowsOverviewForEntityRequest, options?: any): AxiosPromise<WorkflowOverviewListResultDTO>;
    /**
     * Returns true if the workflow service is up for the given workflow ID.
     * @param {string} workflowId ID of the workflow to fetch
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    pingWorkflowServiceById(workflowId: string, options?: any): AxiosPromise<boolean>;
    /**
     * Retrigger an instance
     * @summary Retrigger an instance
     * @param {string} workflowId ID of the workflow
     * @param {string} instanceId ID of the instance to retrigger
     * @param {RetriggerInstanceRequestDTO} retriggerInstanceRequestDTO
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    retriggerInstance(workflowId: string, instanceId: string, retriggerInstanceRequestDTO: RetriggerInstanceRequestDTO, options?: any): AxiosPromise<object>;
};
/**
 * DefaultApi - object-oriented interface
 * @export
 * @class DefaultApi
 * @extends {BaseAPI}
 */
declare class DefaultApi extends BaseAPI {
    /**
     * Aborts a workflow instance identified by the provided instanceId.
     * @summary Abort a workflow instance
     * @param {string} instanceId The identifier of the workflow instance to abort.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApi
     */
    abortWorkflow(instanceId: string, options?: RawAxiosRequestConfig): Promise<axios.AxiosResponse<string, any>>;
    /**
     * Execute a workflow
     * @summary Execute a workflow
     * @param {string} workflowId ID of the workflow to execute
     * @param {ExecuteWorkflowRequestDTO} executeWorkflowRequestDTO
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApi
     */
    executeWorkflow(workflowId: string, executeWorkflowRequestDTO: ExecuteWorkflowRequestDTO, options?: RawAxiosRequestConfig): Promise<axios.AxiosResponse<ExecuteWorkflowResponseDTO, any>>;
    /**
     * Get a workflow execution/run (instance)
     * @summary Get Workflow Instance by ID
     * @param {string} instanceId ID of the workflow instance
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApi
     */
    getInstanceById(instanceId: string, options?: RawAxiosRequestConfig): Promise<axios.AxiosResponse<ProcessInstanceDTO, any>>;
    /**
     * Retrieve an array of workflow executions (instances)
     * @summary Get instances
     * @param {SearchRequest} [searchRequest] Parameters for retrieving instances
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApi
     */
    getInstances(searchRequest?: SearchRequest, options?: RawAxiosRequestConfig): Promise<axios.AxiosResponse<ProcessInstanceListResultDTO, any>>;
    /**
     * Get the workflow input schema. It defines the input fields of the workflow
     * @param {string} workflowId ID of the workflow to fetch
     * @param {string} [instanceId] ID of instance
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApi
     */
    getWorkflowInputSchemaById(workflowId: string, instanceId?: string, options?: RawAxiosRequestConfig): Promise<axios.AxiosResponse<InputSchemaResponseDTO, any>>;
    /**
     * Retrieve an array of workflow executions (instances) for the given workflow
     * @summary Get instances for a specific workflow
     * @param {string} workflowId ID of the workflow
     * @param {SearchRequest} [searchRequest] Parameters for retrieving workflow instances
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApi
     */
    getWorkflowInstances(workflowId: string, searchRequest?: SearchRequest, options?: RawAxiosRequestConfig): Promise<axios.AxiosResponse<ProcessInstanceListResultDTO, any>>;
    /**
     * Returns the key fields of the workflow including data on the last run instance
     * @param {string} workflowId Unique identifier of the workflow
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApi
     */
    getWorkflowOverviewById(workflowId: string, options?: RawAxiosRequestConfig): Promise<axios.AxiosResponse<WorkflowOverviewDTO, any>>;
    /**
     * Get the workflow\'s definition
     * @param {string} workflowId ID of the workflow to fetch
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApi
     */
    getWorkflowSourceById(workflowId: string, options?: RawAxiosRequestConfig): Promise<axios.AxiosResponse<string, any>>;
    /**
     * Retrieve array with the status of all instances
     * @summary Get workflow status list
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApi
     */
    getWorkflowStatuses(options?: RawAxiosRequestConfig): Promise<axios.AxiosResponse<WorkflowRunStatusDTO[], any>>;
    /**
     * Returns the key fields of the workflow including data on the last run instance
     * @param {SearchRequest} [searchRequest] Pagination and filters
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApi
     */
    getWorkflowsOverview(searchRequest?: SearchRequest, options?: RawAxiosRequestConfig): Promise<axios.AxiosResponse<WorkflowOverviewListResultDTO, any>>;
    /**
     * Returns the key fields of the workflow including data on the last run instance
     * @param {GetWorkflowsOverviewForEntityRequest} [getWorkflowsOverviewForEntityRequest] Target entity reference and annotation workflow ids
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApi
     */
    getWorkflowsOverviewForEntity(getWorkflowsOverviewForEntityRequest?: GetWorkflowsOverviewForEntityRequest, options?: RawAxiosRequestConfig): Promise<axios.AxiosResponse<WorkflowOverviewListResultDTO, any>>;
    /**
     * Returns true if the workflow service is up for the given workflow ID.
     * @param {string} workflowId ID of the workflow to fetch
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApi
     */
    pingWorkflowServiceById(workflowId: string, options?: RawAxiosRequestConfig): Promise<axios.AxiosResponse<boolean, any>>;
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
    retriggerInstance(workflowId: string, instanceId: string, retriggerInstanceRequestDTO: RetriggerInstanceRequestDTO, options?: RawAxiosRequestConfig): Promise<axios.AxiosResponse<object, any>>;
}

/**
 * @public
 * DEFAULT_SONATAFLOW_CONTAINER_IMAGE
 * This container image is an upstream build of sonata 1.36 used for dev mode.
 * We will continue maintaining this constant to include the image that is compatible with the plugin code at any given time.
 * This approach will enable a more smooth dev mode experience, as opposed to using nightly or dayly builds.
 */
declare const DEFAULT_SONATAFLOW_CONTAINER_IMAGE = "quay.io/kubesmarts/incubator-kie-sonataflow-devmode:9.103.x-prod";
declare const DEFAULT_SONATAFLOW_PERSISTENCE_PATH = "/home/kogito/persistence";
declare const DEFAULT_SONATAFLOW_BASE_URL = "http://localhost";
declare const DEFAULT_WORKFLOWS_PATH = "workflows";

declare function fromWorkflowSource(content: string): WorkflowDefinition;
declare function toWorkflowString(definition: WorkflowDefinition, format: WorkflowFormat): string;
declare function toWorkflowJson(definition: WorkflowDefinition): string;
declare function toWorkflowYaml(definition: WorkflowDefinition): string;
declare function extractWorkflowFormatFromUri(uri: string): WorkflowFormat;
declare function parseWorkflowVariables(variables?: object): object | undefined;
declare function extractWorkflowFormat(source: string): WorkflowFormat;

declare const QUERY_PARAM_INSTANCE_ID: "instanceId";

declare function isJsonObject(value?: JsonValue): value is JsonObject;

type Capitalized<S extends string> = Capitalize<Lowercase<S>>;
declare const capitalize: <S extends string>(text: S) => Capitalized<S>;
declare const ellipsis: <S extends string>(text: S, prefixLength?: number) => string;

declare const orchestratorWorkflowPermission: _backstage_plugin_permission_common.BasicPermission;
declare const orchestratorWorkflowSpecificPermission: (workflowId: string) => _backstage_plugin_permission_common.BasicPermission;
declare const orchestratorWorkflowUsePermission: _backstage_plugin_permission_common.BasicPermission;
declare const orchestratorWorkflowUseSpecificPermission: (workflowId: string) => _backstage_plugin_permission_common.BasicPermission;
declare const orchestratorAdminViewPermission: _backstage_plugin_permission_common.BasicPermission;
declare const orchestratorInstanceAdminViewPermission: _backstage_plugin_permission_common.BasicPermission;
declare const orchestratorPermissions: _backstage_plugin_permission_common.BasicPermission[];

/**
 * Descriptor for authentication token configuration
 */
type AuthTokenDescriptor = {
    /**
     * The provider is the same as in the same provider that appears in the auth section of the app-config.yaml file.
     * The built in providers supported are: github, gitlab and microsoft.
     * The provider matching is case insensitive (e.g., provider: 'github' matches header: 'X-Authorization-Github')
     * For custom provider the same applies (e.g., provider: 'my-custom-provider' matches header: 'X-Authorization-My-Custom-Provider')
     */
    provider: string;
    /**
     * Backstage apiRef id for custom authentication provider. Must match the backstage ApiRef id of the custom provider plugin.
     */
    customProviderApiId?: string;
    /**
     * OAuth scope for token permissions (e.g., 'repo' for GitHub repository write permissions)
     */
    scope?: OAuthScope;
    /**
     * Type of authentication token to request. If not provided, the default is 'oauth'.
     */
    tokenType?: 'openId' | 'oauth';
};

export { type AuthToken, type AuthTokenDescriptor, type Capitalized, type ComposedSchema, Configuration, type ConfigurationParameters, DEFAULT_SONATAFLOW_BASE_URL, DEFAULT_SONATAFLOW_CONTAINER_IMAGE, DEFAULT_SONATAFLOW_PERSISTENCE_PATH, DEFAULT_WORKFLOWS_PATH, DefaultApi, DefaultApiAxiosParamCreator, DefaultApiFactory, DefaultApiFp, type ErrorResponse, type ExecuteWorkflowRequestDTO, type ExecuteWorkflowResponseDTO, type FieldFilter, FieldFilterOperatorEnum, type FieldFilterValue, type Filter, type GetOverviewsRequestParams, type GetWorkflowsOverviewForEntityRequest, type InputSchemaResponseDTO, type IntrospectionField, type IntrospectionQuery, type IntrospectionType, type IntrospectionTypeRef, type JsonObjectSchema, type LogicalFilter, LogicalFilterOperatorEnum, type Milestone, MilestoneStatus, type NestedFilter, type NestedFilterNested, type Node, type NodeInstance, type NodeInstanceDTO, type OmitRecursively, type PaginationInfoDTO, PaginationInfoDTOOrderDirectionEnum, type ProcessInstance, type ProcessInstanceDTO, type ProcessInstanceError, type ProcessInstanceErrorDTO, type ProcessInstanceListResultDTO, ProcessInstanceState, type ProcessInstanceStateValues, ProcessInstanceStatusDTO, type ProcessInstanceVariables, QUERY_PARAM_INSTANCE_ID, type RetriggerInstanceRequestDTO, type SearchRequest, type TriggerableNode, TypeKind, TypeName, type WorkflowDTO, type WorkflowDataDTO, type WorkflowDefinition, type WorkflowExecutionResponse, type WorkflowFormat, WorkflowFormatDTO, type WorkflowInfo, type WorkflowInputSchemaStep, type WorkflowListResult, type WorkflowListResultDTO, type WorkflowOverview, type WorkflowOverviewDTO, type WorkflowOverviewListResult, type WorkflowOverviewListResultDTO, type WorkflowProgressDTO, type WorkflowResultDTO, type WorkflowResultDTONextWorkflowsInner, type WorkflowResultDTOOutputsInner, WorkflowResultDTOOutputsInnerFormatEnum, type WorkflowResultDTOOutputsInnerValue, type WorkflowRunStatusDTO, capitalize, ellipsis, extractWorkflowFormat, extractWorkflowFormatFromUri, fromWorkflowSource, isComposedSchema, isJsonObject, isJsonObjectSchema, openApiDocument, orchestratorAdminViewPermission, orchestratorInstanceAdminViewPermission, orchestratorPermissions, orchestratorWorkflowPermission, orchestratorWorkflowSpecificPermission, orchestratorWorkflowUsePermission, orchestratorWorkflowUseSpecificPermission, parseWorkflowVariables, toWorkflowJson, toWorkflowString, toWorkflowYaml };

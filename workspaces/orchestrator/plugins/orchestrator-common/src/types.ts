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

import type { JsonObject } from '@backstage/types';

import type { Specification } from '@severlessworkflow/sdk-typescript';
import type { JSONSchema7, JSONSchema7Definition } from 'json-schema';

import type { ProcessInstanceStateValues } from './models';

type Id<T> = { [P in keyof T]: T[P] };

type OmitDistributive<T, K extends PropertyKey> = T extends any
  ? T extends object
    ? Id<OmitRecursively<T, K>>
    : T
  : never;

/**
 * Utility type for recursively omitting properties from nested objects
 */
export type OmitRecursively<T, K extends PropertyKey> = Omit<
  { [P in keyof T]: OmitDistributive<T[P], K> },
  K
>;

/**
 * Workflow definition type based on ServerlessWorkflow specification
 * with the 'normalize' method omitted
 */
export type WorkflowDefinition = OmitRecursively<
  Specification.Workflow,
  'normalize'
>;

/**
 * Result structure for paginated workflow lists
 */
export type WorkflowListResult = {
  /** Array of workflow definitions */
  items: WorkflowDefinition[];
  /** Starting offset for pagination */
  offset: number;
  /** Maximum number of items per page */
  limit: number;
};

/**
 * Result structure for paginated workflow overview lists
 */
export type WorkflowOverviewListResult = {
  /** Array of workflow overviews */
  items: WorkflowOverview[];
  /** Starting offset for pagination */
  offset: number;
  /** Maximum number of items per page */
  limit: number;
};

/**
 * Supported workflow definition formats
 */
export type WorkflowFormat = 'yaml' | 'json';

/**
 * Configuration for a workflow input schema step
 */
export type WorkflowInputSchemaStep = {
  /** JSON schema for the step */
  schema: JsonObjectSchema;
  /** Display title for the step */
  title: string;
  /** Unique identifier for the step */
  key: string;
  /** Initial data for the step */
  data: JsonObject;
  /** Keys that should be read-only */
  readonlyKeys: string[];
};

/**
 * JSON schema specifically for object types with typed properties
 */
export type JsonObjectSchema = Omit<JSONSchema7, 'properties'> & {
  properties: { [key: string]: JSONSchema7 };
};

/**
 * Composed schema structure for nested object schemas
 */
export type ComposedSchema = Omit<JSONSchema7, 'properties'> & {
  properties: {
    [key: string]: Omit<JSONSchema7, 'properties'> & {
      properties: { [key: string]: JsonObjectSchema };
    };
  };
};

/**
 * Type guard to check if a schema is a JsonObjectSchema
 */
export const isJsonObjectSchema = (
  schema: JSONSchema7 | JsonObjectSchema | JSONSchema7Definition,
): schema is JsonObjectSchema =>
  typeof schema === 'object' &&
  !!schema.properties &&
  Object.values(schema.properties).filter(
    curSchema => typeof curSchema !== 'object',
  ).length === 0;

/**
 * Type guard to check if a schema is a ComposedSchema
 */
export const isComposedSchema = (
  schema: JSONSchema7 | ComposedSchema,
): schema is ComposedSchema =>
  !!schema.properties &&
  Object.values(schema.properties).filter(
    curSchema => !isJsonObjectSchema(curSchema),
  ).length === 0;

/**
 * Response structure for workflow execution requests
 */
export interface WorkflowExecutionResponse {
  /** Unique identifier of the executed workflow instance */
  id: string;
}

/**
 * Categories for classifying workflows
 */
export enum WorkflowCategory {
  /** Assessment workflows for evaluating resources or conditions */
  ASSESSMENT = 'assessment',
  /** Infrastructure workflows for managing infrastructure resources */
  INFRASTRUCTURE = 'infrastructure',
}

/**
 * Overview information for a workflow including execution statistics
 */
export interface WorkflowOverview {
  /** Unique identifier of the workflow */
  workflowId: string;
  /** Format of the workflow definition */
  format: WorkflowFormat;
  /** Human-readable name of the workflow */
  name?: string;
  /** ID of the most recent workflow execution */
  lastRunId?: string;
  /** Timestamp (in milliseconds) of the last workflow trigger */
  lastTriggeredMs?: number;
  /** Status of the most recent workflow execution */
  lastRunStatus?: ProcessInstanceStateValues;
  /** Category classification of the workflow */
  category?: string;
  /** Average execution duration in milliseconds */
  avgDurationMs?: number;
  /** Description of the workflow */
  description?: string;
  /** Whether the workflow is currently available for execution */
  isAvailable?: boolean;
}

/**
 * Detailed information about a workflow definition
 */
export interface WorkflowInfo {
  /** Unique identifier of the workflow */
  id: string;
  /** Type of the workflow */
  type?: string;
  /** Human-readable name of the workflow */
  name?: string;
  /** Version of the workflow */
  version?: string;
  /** Annotations associated with the workflow */
  annotations?: string[];
  /** Description of the workflow */
  description?: string;
  /** JSON schema for workflow input validation */
  inputSchema?: JSONSchema7;
  /** API endpoint for the workflow */
  endpoint?: string;
  /** Service URL where the workflow is hosted */
  serviceUrl?: string;
  /** Roles required to execute the workflow */
  roles?: string[];
  /** Source definition of the workflow */
  source?: string;
  /** Additional metadata as key-value pairs */
  metadata?: Map<string, string>;
  /** Nodes that make up the workflow */
  nodes?: Node[];
}

/**
 * Represents a single node within a workflow
 */
export interface Node {
  /** Unique identifier of the node */
  id: string;
  /** Type of the node */
  type?: string;
  /** Human-readable name of the node */
  name?: string;
  /** Unique identifier across all workflow instances */
  uniqueId?: string;
  /** Identifier for the node definition */
  nodeDefinitionId?: string;
}

/**
 * Process instance with assessment information
 */
export interface AssessedProcessInstance {
  /** The process instance being assessed */
  instance: ProcessInstance;
  /** The process instance that performed the assessment */
  assessedBy?: ProcessInstance;
}

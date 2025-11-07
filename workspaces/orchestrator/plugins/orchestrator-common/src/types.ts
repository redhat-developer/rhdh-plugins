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

import type { Specification } from '@serverlessworkflow/sdk-typescript';
import type { JSONSchema7, JSONSchema7Definition } from 'json-schema';

import type { ProcessInstanceStateValues } from './models';

type Id<T> = { [P in keyof T]: T[P] };

type OmitDistributive<T, K extends PropertyKey> = T extends any
  ? T extends object
    ? Id<OmitRecursively<T, K>>
    : T
  : never;

export type OmitRecursively<T, K extends PropertyKey> = Omit<
  { [P in keyof T]: OmitDistributive<T[P], K> },
  K
>;

export type WorkflowDefinition = OmitRecursively<
  Specification.Workflow,
  'normalize' | 'asPlainObject'
>;

export type WorkflowListResult = {
  items: WorkflowDefinition[];
  offset: number;
  limit: number;
};

export type WorkflowOverviewListResult = {
  items: WorkflowOverview[];
  offset: number;
  limit: number;
};

export type WorkflowFormat = 'yaml' | 'json';

export type WorkflowInputSchemaStep = {
  schema: JsonObjectSchema;
  title: string;
  key: string;
  data: JsonObject;
  readonlyKeys: string[];
};

export type JsonObjectSchema = Omit<JSONSchema7, 'properties'> & {
  properties: { [key: string]: JSONSchema7 };
};

export type ComposedSchema = Omit<JSONSchema7, 'properties'> & {
  properties: {
    [key: string]: Omit<JSONSchema7, 'properties'> & {
      properties: { [key: string]: JsonObjectSchema };
    };
  };
};

export const isJsonObjectSchema = (
  schema: JSONSchema7 | JsonObjectSchema | JSONSchema7Definition,
): schema is JsonObjectSchema =>
  typeof schema === 'object' &&
  !!schema.properties &&
  Object.values(schema.properties).filter(
    curSchema => typeof curSchema !== 'object',
  ).length === 0;

export const isComposedSchema = (
  schema: JSONSchema7 | ComposedSchema,
): schema is ComposedSchema =>
  !!schema.properties &&
  Object.values(schema.properties).filter(
    curSchema => !isJsonObjectSchema(curSchema),
  ).length === 0;

export interface WorkflowExecutionResponse {
  id: string;
}

export interface WorkflowOverview {
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

export interface WorkflowInfo {
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

export interface Node {
  id: string;
  type?: string;
  name?: string;
  uniqueId?: string;
  nodeDefinitionId?: string;
}

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

import {
  DEFAULT_WORKFLOW_SPEC_VERSION,
  type WorkflowBuilderFiles,
  type WorkflowBuilderIdentity,
} from './types';

export const DEFAULT_BUILDER_IDENTITY: WorkflowBuilderIdentity = {
  name: 'New workflow',
  description: '',
  workflowId: 'new-workflow',
  version: '1.0',
  specVersion: DEFAULT_WORKFLOW_SPEC_VERSION,
};

/**
 * Derives workflow id / filenames from the display name (prototype: kebab-case).
 * e.g. "test name new" → "test-name-new"
 */
export const slugifyWorkflowId = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Escape a value for inclusion inside a YAML double-quoted scalar. */
const escapeYamlDoubleQuoted = (value: string): string =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t');

const yamlDoubleQuoted = (value: string): string =>
  `"${escapeYamlDoubleQuoted(value)}"`;

/**
 * Builds the starter set of 4 builder files for a from-scratch session.
 * Output schema is intentionally empty (optional until the user fills it).
 */
export const createStarterWorkflowFiles = (
  identity: WorkflowBuilderIdentity = DEFAULT_BUILDER_IDENTITY,
): WorkflowBuilderFiles => {
  const { name, description, workflowId, version, specVersion } = identity;
  const inputSchemaPath = `schemas/${workflowId}.schema.json`;

  const workflowYaml = [
    `id: ${yamlDoubleQuoted(workflowId)}`,
    `version: ${yamlDoubleQuoted(version)}`,
    `specVersion: ${yamlDoubleQuoted(specVersion)}`,
    `name: ${yamlDoubleQuoted(name)}`,
    `description: ${yamlDoubleQuoted(description)}`,
    'annotations:',
    `  - 'workflow-type/infrastructure'`,
    `dataInputSchema: ${yamlDoubleQuoted(inputSchemaPath)}`,
    '',
    'start: Start',
    'states:',
    '  - name: Start',
    '    type: operation',
    '',
  ].join('\n');

  const templateYaml = [
    'apiVersion: scaffolder.backstage.io/v1beta3',
    'kind: Template',
    'metadata:',
    `  name: ${yamlDoubleQuoted(workflowId)}`,
    `  title: ${yamlDoubleQuoted(name)}`,
    `  description: ${yamlDoubleQuoted(description || name)}`,
    'spec:',
    '  owner: group:default/example',
    '  type: service',
    '  parameters: []',
    '  steps: []',
    '',
  ].join('\n');

  const inputSchemaJson = `${JSON.stringify(
    {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: `${name} parameters`,
      'x-orchestrator-wizard-step-count': 1,
      'x-orchestrator-wizard-step-names': {},
      type: 'object',
      required: [],
      properties: {},
    },
    null,
    2,
  )}\n`;

  // Empty optional output schema — user can fill later.
  const outputSchemaJson = '';

  return {
    workflowYaml,
    templateYaml,
    inputSchemaJson,
    outputSchemaJson,
  };
};

export const getBuilderFileName = (
  key: keyof WorkflowBuilderFiles,
  workflowId: string,
): string => {
  switch (key) {
    case 'workflowYaml':
      return `${workflowId}.sw.yaml`;
    case 'templateYaml':
      return 'template.yaml';
    case 'inputSchemaJson':
      return `${workflowId}.schema.json`;
    case 'outputSchemaJson':
      return `${workflowId}.output.schema.json`;
    default:
      return workflowId;
  }
};

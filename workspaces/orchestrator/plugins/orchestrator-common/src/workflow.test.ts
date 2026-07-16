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

import { Specification } from '@serverlessworkflow/sdk-typescript';
import { dump } from 'js-yaml';

import { WorkflowDefinition, WorkflowFormat } from './types';
import {
  extractWorkflowFormat,
  extractWorkflowFormatFromUri,
  fromWorkflowSource,
  parseWorkflowVariables,
  toWorkflowJson,
  toWorkflowString,
  toWorkflowYaml,
} from './workflow';

jest.mock('@serverlessworkflow/sdk-typescript', () => ({
  Specification: {
    Workflow: {
      fromSource: jest.fn(),
    },
  },
}));

const sampleDefinition = {
  id: 'my-workflow',
  name: 'My Workflow',
  version: '1.0',
  specVersion: '0.8',
  start: 'init',
  states: [],
} as unknown as WorkflowDefinition;

describe('extractWorkflowFormat', () => {
  it('should return "json" when input is valid JSON', () => {
    const source = '{"name": "workflow", "steps": ["step1", "step2"]}';
    expect(extractWorkflowFormat(source)).toEqual('json');
  });

  it('should return "yaml" for any non-JSON string', () => {
    const source = 'name: workflow\nsteps:\n  - step1\n  - step2\n';
    expect(extractWorkflowFormat(source)).toEqual('yaml');
  });
});

describe('toWorkflowString', () => {
  it('serializes to JSON when format is "json"', () => {
    const result = toWorkflowString(sampleDefinition, 'json');
    expect(result).toEqual(JSON.stringify(sampleDefinition, null, 2));
  });

  it('serializes to YAML when format is "yaml"', () => {
    const result = toWorkflowString(sampleDefinition, 'yaml');
    expect(result).toEqual(dump(sampleDefinition));
  });

  it('throws for unsupported format', () => {
    expect(() =>
      toWorkflowString(sampleDefinition, 'xml' as WorkflowFormat),
    ).toThrow('Unsupported format xml');
  });
});

describe('toWorkflowJson', () => {
  it('returns a JSON string of the definition', () => {
    const result = toWorkflowJson(sampleDefinition);
    expect(JSON.parse(result)).toEqual(sampleDefinition);
  });

  it('pretty-prints with 2-space indentation', () => {
    const result = toWorkflowJson({
      id: 'wf',
    } as unknown as WorkflowDefinition);
    expect(result).toBe('{\n  "id": "wf"\n}');
  });
});

describe('toWorkflowYaml', () => {
  it('returns a YAML string of the definition', () => {
    const result = toWorkflowYaml(sampleDefinition);
    expect(result).toContain('id: my-workflow');
    expect(result).toContain('name: My Workflow');
  });
});

describe('extractWorkflowFormatFromUri', () => {
  it('returns "json" for a .sw.json URI', () => {
    expect(extractWorkflowFormatFromUri('workflow.sw.json')).toEqual('json');
  });

  it('returns "yaml" for a .sw.yaml URI', () => {
    expect(extractWorkflowFormatFromUri('workflow.sw.yaml')).toEqual('yaml');
  });

  it('returns "yaml" for a .sw.yml URI', () => {
    expect(extractWorkflowFormatFromUri('workflow.sw.yml')).toEqual('yaml');
  });

  it('throws for a URI with an unsupported extension', () => {
    expect(() => extractWorkflowFormatFromUri('workflow.sw.xml')).toThrow(
      'Unsupported workflow format for uri workflow.sw.xml',
    );
  });

  it('throws when the URI has no recognized suffix', () => {
    expect(() => extractWorkflowFormatFromUri('workflow.json')).toThrow(
      'Unsupported workflow format',
    );
  });
});

describe('parseWorkflowVariables', () => {
  it('returns undefined for undefined input', () => {
    expect(parseWorkflowVariables(undefined)).toBeUndefined();
  });

  it('passes through a plain object unchanged', () => {
    const vars = { key: 'value', count: 42 };
    expect(parseWorkflowVariables(vars)).toEqual(vars);
  });

  it('parses a valid JSON string into an object', () => {
    const vars = { key: 'value' };
    expect(
      parseWorkflowVariables(JSON.stringify(vars) as unknown as object),
    ).toEqual(vars);
  });

  it('throws for an invalid JSON string', () => {
    expect(() =>
      parseWorkflowVariables('{invalid json}' as unknown as object),
    ).toThrow('Error when parsing process instance variables');
  });
});

describe('fromWorkflowSource', () => {
  it('delegates to Specification.Workflow.fromSource and strips normalize', () => {
    const fakeWorkflow = { id: 'test', normalize: jest.fn() };
    jest.mocked(Specification.Workflow.fromSource).mockReturnValue({
      sourceModel: fakeWorkflow,
    } as any);

    const result = fromWorkflowSource('{"id":"test"}');

    expect(Specification.Workflow.fromSource).toHaveBeenCalledWith(
      '{"id":"test"}',
    );
    expect(result).toMatchObject({ id: 'test' });
    expect(result).not.toHaveProperty('normalize');
  });
});

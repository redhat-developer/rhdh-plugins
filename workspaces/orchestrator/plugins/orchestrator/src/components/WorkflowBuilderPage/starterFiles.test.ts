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
  createStarterWorkflowFiles,
  DEFAULT_BUILDER_IDENTITY,
  getBuilderFileName,
  slugifyWorkflowId,
} from './starterFiles';
import { DEFAULT_WORKFLOW_SPEC_VERSION } from './types';

describe('slugifyWorkflowId', () => {
  it('kebab-cases the workflow display name', () => {
    expect(slugifyWorkflowId('test name new')).toBe('test-name-new');
    expect(slugifyWorkflowId('New workflow')).toBe('new-workflow');
  });
});

describe('createStarterWorkflowFiles', () => {
  it('creates four starter files with spec 0.8 and empty output schema', () => {
    const files = createStarterWorkflowFiles(DEFAULT_BUILDER_IDENTITY);

    expect(files.workflowYaml).toContain(
      `specVersion: "${DEFAULT_WORKFLOW_SPEC_VERSION}"`,
    );
    expect(files.workflowYaml).toContain('id: "new-workflow"');
    expect(files.workflowYaml).toContain(
      'dataInputSchema: "schemas/new-workflow.schema.json"',
    );
    expect(files.templateYaml).toContain('kind: Template');
    expect(files.inputSchemaJson).toContain('"type": "object"');
    expect(files.outputSchemaJson).toBe('');
  });

  it('uses the workflow id in YAML and starter filenames', () => {
    const identity = {
      ...DEFAULT_BUILDER_IDENTITY,
      name: 'test name new',
      description: 'test description',
      workflowId: 'test-name-new',
    };
    const files = createStarterWorkflowFiles(identity);

    expect(files.workflowYaml).toContain('id: "test-name-new"');
    expect(files.workflowYaml).toContain('name: "test name new"');
    expect(files.workflowYaml).toContain('description: "test description"');
    expect(files.workflowYaml).toContain(
      'dataInputSchema: "schemas/test-name-new.schema.json"',
    );
    expect(files.templateYaml).toContain('name: "test-name-new"');
    expect(files.templateYaml).toContain('title: "test name new"');
    expect(files.templateYaml).toContain('description: "test description"');
    expect(getBuilderFileName('workflowYaml', identity.workflowId)).toBe(
      'test-name-new.sw.yaml',
    );
    expect(getBuilderFileName('inputSchemaJson', identity.workflowId)).toBe(
      'test-name-new.schema.json',
    );
    expect(getBuilderFileName('outputSchemaJson', identity.workflowId)).toBe(
      'test-name-new.output.schema.json',
    );
  });

  it('escapes quotes and newlines in starter YAML scalars', () => {
    const files = createStarterWorkflowFiles({
      ...DEFAULT_BUILDER_IDENTITY,
      name: 'Say "hello"',
      description: 'Line 1\nLine with "quotes"',
      workflowId: 'say-hello',
      version: '1.0"beta',
    });

    expect(files.templateYaml).toContain('title: "Say \\"hello\\""');
    expect(files.templateYaml).toContain(
      'description: "Line 1\\nLine with \\"quotes\\""',
    );
    expect(files.workflowYaml).toContain('name: "Say \\"hello\\""');
    expect(files.workflowYaml).toContain(
      'description: "Line 1\\nLine with \\"quotes\\""',
    );
    expect(files.workflowYaml).toContain('version: "1.0\\"beta"');
    expect(files.workflowYaml).toContain('id: "say-hello"');
  });
});

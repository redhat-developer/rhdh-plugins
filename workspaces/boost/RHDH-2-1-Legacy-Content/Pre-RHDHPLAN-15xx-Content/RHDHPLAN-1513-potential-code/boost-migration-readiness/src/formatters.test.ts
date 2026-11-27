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

import type { MigrationReport } from './types';
import { formatJson, formatText } from './formatters';

const sampleReport: MigrationReport = {
  entities: [
    {
      entityRef: 'api:default/my-mcp-server',
      name: 'my-mcp-server',
      category: 'mcp-server',
      currentKind: 'API',
      currentSpecType: 'mcp-server',
      targetKind: 'API',
      targetModel: 'McpServerApiEntity',
      confidence: 'high',
      transformations: [
        'Kind already aligned (API). No kind change required.',
        'Adopt spec.remotes instead of spec.definition',
      ],
      rfcIds: ['backstage#34016'],
      alreadyAligned: true,
      warnings: [],
    },
    {
      entityRef: 'airesource:default/my-skill',
      name: 'my-skill',
      category: 'skill',
      currentKind: 'AIResource',
      currentSpecType: 'skill',
      targetKind: 'AiResource',
      targetModel: undefined,
      confidence: 'medium-high',
      transformations: ['Kind/name casing alignment: AIResource → AiResource'],
      rfcIds: ['backstage#33575'],
      alreadyAligned: false,
      warnings: [],
    },
  ],
};

describe('formatJson', () => {
  it('produces valid JSON output', () => {
    const output = formatJson(sampleReport);
    const parsed = JSON.parse(output);
    expect(parsed.entities).toHaveLength(2);
  });

  it('includes all assessment fields', () => {
    const output = formatJson(sampleReport);
    const parsed = JSON.parse(output);
    const entity = parsed.entities[0];
    expect(entity.name).toBe('my-mcp-server');
    expect(entity.currentKind).toBe('API');
    expect(entity.currentSpecType).toBe('mcp-server');
    expect(entity.targetKind).toBe('API');
    expect(entity.targetModel).toBe('McpServerApiEntity');
    expect(entity.confidence).toBe('high');
    expect(entity.transformations).toBeInstanceOf(Array);
    expect(entity.rfcIds).toBeInstanceOf(Array);
    expect(entity.alreadyAligned).toBe(true);
    expect(entity.warnings).toBeInstanceOf(Array);
  });

  it('preserves raw entity data including control characters (machine-readable output)', () => {
    // JSON output is machine-readable and intentionally preserves raw
    // entity data without terminal sanitization. Consumers that display
    // JSON values in a terminal must sanitize on their own. This test
    // documents the intentional design choice — DEL (0x7f) is valid
    // content in JSON strings per ECMA-262.
    const report: MigrationReport = {
      entities: [
        {
          entityRef: 'api:default/del-test',
          name: 'entity\x7fname',
          category: 'mcp-server',
          currentKind: 'API',
          currentSpecType: 'mcp-server',
          targetKind: 'API',
          targetModel: 'McpServerApiEntity',
          confidence: 'high',
          transformations: [],
          rfcIds: [],
          alreadyAligned: true,
          warnings: [],
        },
      ],
    };
    const output = formatJson(report);
    const parsed = JSON.parse(output);
    // Raw data preserved — JSON is not terminal output
    expect(parsed.entities[0].name).toBe('entity\x7fname');
  });
});

describe('formatText', () => {
  it('includes the report header', () => {
    const output = formatText(sampleReport);
    expect(output).toContain('Migration Readiness Report');
    expect(output).toContain('=========================');
  });

  it.each([
    ['entity names', ['Entity: my-mcp-server', 'Entity: my-skill']],
    [
      'current kind and spec.type',
      [
        'Current: kind=API, spec.type=mcp-server',
        'Current: kind=AIResource, spec.type=skill',
      ],
    ],
    ['target kind with model', ['Target:  kind=API (McpServerApiEntity)']],
    ['target without model', ['Target:  kind=AiResource, backstage#33575']],
  ] as [string, string[]][])(
    'includes %s',
    (_label: string, expected: string[]) => {
      const output = formatText(sampleReport);
      for (const text of expected) {
        expect(output).toContain(text);
      }
    },
  );

  it.each([
    ['High', 'Confidence: High'],
    ['Medium–High', 'Confidence: Medium–High'],
    ['transformations header', 'Transformations:'],
  ] as [string, string][])(
    'includes %s',
    (_label: string, expected: string) => {
      const output = formatText(sampleReport);
      expect(output).toContain(expected);
    },
  );

  it('shows aligned status', () => {
    const output = formatText(sampleReport);
    expect(output).toContain('Already aligned with upstream target');
  });

  it('includes footer about assessment-only', () => {
    const output = formatText(sampleReport);
    expect(output).toContain('This is a migration-readiness assessment.');
    expect(output).toContain(
      'Actual migration is future work pending upstream RFC finalization.',
    );
  });

  it('shows warnings when present', () => {
    const reportWithWarnings: MigrationReport = {
      entities: [
        {
          ...sampleReport.entities[0],
          warnings: ['Partial annotations — missing rhdh.io/ai-asset-version.'],
        },
      ],
    };
    const output = formatText(reportWithWarnings);
    expect(output).toContain('Warnings:');
    expect(output).toContain('Partial annotations');
  });

  it('shows "No AI asset entities found" for empty report', () => {
    const emptyReport: MigrationReport = { entities: [] };
    const output = formatText(emptyReport);
    expect(output).toContain('No AI asset entities found.');
  });

  it('strips DEL character (0x7f) from entity data', () => {
    // DEL (0x7f) is a control character that should be sanitized to
    // prevent terminal manipulation via untrusted catalog entity data.
    const report: MigrationReport = {
      entities: [
        {
          entityRef: 'api:default/del-test',
          name: 'entity\x7fname',
          category: 'mcp-server',
          currentKind: 'API',
          currentSpecType: 'mcp-server',
          targetKind: 'API',
          targetModel: 'McpServerApiEntity',
          confidence: 'high',
          transformations: [],
          rfcIds: [],
          alreadyAligned: true,
          warnings: [],
        },
      ],
    };
    const output = formatText(report);
    expect(output).not.toContain('\x7f');
    expect(output).toContain('entityname');
  });

  it('shows "No upstream kind yet" for low confidence entities', () => {
    const report: MigrationReport = {
      entities: [
        {
          entityRef: 'resource:default/my-model',
          name: 'my-model',
          category: 'ai-model',
          currentKind: 'Resource',
          currentSpecType: 'ai-model',
          targetKind: undefined,
          targetModel: undefined,
          confidence: 'low',
          transformations: ['No upstream kind yet.'],
          rfcIds: [],
          alreadyAligned: false,
          warnings: [],
        },
      ],
    };
    const output = formatText(report);
    expect(output).toContain('Target:  No upstream kind yet');
    expect(output).toContain('Confidence: Low');
  });
});

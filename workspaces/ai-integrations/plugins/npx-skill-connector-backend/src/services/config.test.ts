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

import { ConfigReader } from '@backstage/config';
import {
  readNpxConnectorOptions,
  readSourceConfigs,
  readSourceSchedule,
} from './config';

describe('readNpxConnectorOptions', () => {
  it('preserves defaults when configuration is absent', () => {
    expect(readNpxConnectorOptions(new ConfigReader({}))).toEqual({
      fetchTimeoutMs: 30000,
      maxArtifactSizeBytes: 1048576,
      maxAggregateContentSizeBytes: 52428800,
      maxIndexResponseSizeBytes: 5242880,
      maxArtifacts: 25,
      maxRetries: 2,
      retryBaseDelayMs: 2000,
      sourceOperationDeadlineMs: 300000,
    });
  });

  it('resolves overrides independently and preserves zero retries', () => {
    const overrides = {
      fetchTimeoutMs: 60000,
      maxArtifactSizeBytes: 100,
      maxAggregateContentSizeBytes: 500,
      maxIndexResponseSizeBytes: 200,
      maxArtifacts: 100,
      maxRetries: 0,
      retryBaseDelayMs: 10,
      sourceOperationDeadlineMs: 120000,
    };
    expect(
      readNpxConnectorOptions(
        new ConfigReader({ npxSkillConnector: overrides }),
      ),
    ).toEqual(overrides);

    const defaults = readNpxConnectorOptions(
      new ConfigReader({ npxSkillConnector: {} }),
    );
    expect(defaults.fetchTimeoutMs).toBe(30000);
    expect(defaults.maxRetries).toBe(2);
  });

  it.each([
    ['fetchTimeoutMs', 0],
    ['fetchTimeoutMs', 2147483648],
    ['retryBaseDelayMs', 2147483648],
    ['retryBaseDelayMs', 0],
    ['maxArtifactSizeBytes', -1],
    ['maxArtifactSizeBytes', 1.5],
    ['maxAggregateContentSizeBytes', 0],
    ['maxIndexResponseSizeBytes', 0],
    ['sourceOperationDeadlineMs', 0],
    ['sourceOperationDeadlineMs', 2147483648],
    ['maxArtifacts', 0],
    ['maxArtifacts', -1],
    ['maxArtifacts', 1.5],
    ['maxRetries', -1],
    ['maxRetries', 1.5],
    ['fetchTimeoutMs', 'not-a-number'],
  ])('rejects invalid %s = %p instead of falling back', (key, value) => {
    expect(() =>
      readNpxConnectorOptions(
        new ConfigReader({ npxSkillConnector: { [key]: value } }),
      ),
    ).toThrow(key);
  });
});

describe('readSourceConfigs', () => {
  it('returns empty when no config is present', () => {
    expect(readSourceConfigs(new ConfigReader({}))).toEqual([]);
  });

  it('rejects missing source ID', () => {
    expect(() =>
      readSourceConfigs(
        new ConfigReader({
          npxSkillConnector: {
            sources: [{ indexUrl: 'https://example.com/index.json' }],
          },
        }),
      ),
    ).toThrow('id is required');
  });

  it.each(['.', '..'])('rejects dot/dot-dot source ID %p', dotId => {
    expect(() =>
      readSourceConfigs(
        new ConfigReader({
          npxSkillConnector: {
            sources: [
              { id: dotId, indexUrl: 'https://example.com/index.json' },
            ],
          },
        }),
      ),
    ).toThrow(/must not be '\.' or '\.\.'/);
  });

  it('rejects duplicate source IDs', () => {
    expect(() =>
      readSourceConfigs(
        new ConfigReader({
          npxSkillConnector: {
            sources: [
              { id: 'dup', indexUrl: 'https://example.com/index.json' },
              { id: 'dup', indexUrl: 'https://other.com/index.json' },
            ],
          },
        }),
      ),
    ).toThrow("Duplicate source ID 'dup'");
  });

  it('rejects missing index URL', () => {
    expect(() =>
      readSourceConfigs(
        new ConfigReader({
          npxSkillConnector: {
            sources: [{ id: 'test' }],
          },
        }),
      ),
    ).toThrow('indexUrl is required');
  });

  it('rejects non-HTTPS index URLs', () => {
    expect(() =>
      readSourceConfigs(
        new ConfigReader({
          npxSkillConnector: {
            sources: [
              { id: 'test', indexUrl: 'http://example.com/index.json' },
            ],
          },
        }),
      ),
    ).toThrow('HTTPS');
  });

  it('rejects index URLs with embedded credentials', () => {
    expect(() =>
      readSourceConfigs(
        new ConfigReader({
          npxSkillConnector: {
            sources: [
              {
                id: 'test',
                indexUrl: 'https://user:pass@example.com/index.json',
              },
            ],
          },
        }),
      ),
    ).toThrow('credentials');
  });

  it('rejects index URLs targeting localhost', () => {
    expect(() =>
      readSourceConfigs(
        new ConfigReader({
          npxSkillConnector: {
            sources: [{ id: 'test', indexUrl: 'https://localhost/index.json' }],
          },
        }),
      ),
    ).toThrow('public hostname');
  });

  it('rejects index URLs targeting IP addresses', () => {
    expect(() =>
      readSourceConfigs(
        new ConfigReader({
          npxSkillConnector: {
            sources: [
              { id: 'test', indexUrl: 'https://192.168.1.1/index.json' },
            ],
          },
        }),
      ),
    ).toThrow('public hostname');
  });

  it('rejects index URLs with fragment identifiers', () => {
    expect(() =>
      readSourceConfigs(
        new ConfigReader({
          npxSkillConnector: {
            sources: [
              {
                id: 'test',
                indexUrl: 'https://example.com/index.json#section',
              },
            ],
          },
        }),
      ),
    ).toThrow('fragment');
  });

  it('accepts valid source configuration', () => {
    const sources = readSourceConfigs(
      new ConfigReader({
        npxSkillConnector: {
          sources: [
            {
              id: 'rhess',
              indexUrl: 'https://skills.example.com/v0.2/index.json',
              allowedOrigins: ['https://cdn.example.com'],
            },
          ],
        },
      }),
    );
    expect(sources).toHaveLength(1);
    expect(sources[0].id).toBe('rhess');
    expect(sources[0].indexUrl).toBe(
      'https://skills.example.com/v0.2/index.json',
    );
    expect(sources[0].allowedOrigins).toEqual(['https://cdn.example.com']);
  });

  it('keeps all source settings backend-only', () => {
    // The config.d.ts marks all fields with @visibility backend.
    // This test verifies the source config structure is read correctly.
    const sources = readSourceConfigs(
      new ConfigReader({
        npxSkillConnector: {
          sources: [
            {
              id: 'source1',
              indexUrl: 'https://example.com/index.json',
            },
          ],
        },
      }),
    );
    expect(sources[0]).toEqual(
      expect.objectContaining({
        id: 'source1',
        indexUrl: 'https://example.com/index.json',
      }),
    );
    // Schedule defaults should be applied
    expect(sources[0].schedule).toEqual({
      frequency: { minutes: 10 },
      timeout: { milliseconds: 600000 },
      initialDelay: { seconds: 0 },
      scope: 'local',
    });
  });

  it('rejects invalid origin patterns', () => {
    expect(() =>
      readSourceConfigs(
        new ConfigReader({
          npxSkillConnector: {
            sources: [
              {
                id: 'test',
                indexUrl: 'https://example.com/index.json',
                allowedOrigins: ['http://insecure.example.com'],
              },
            ],
          },
        }),
      ),
    ).toThrow('allowedOrigins');
  });

  it('rejects invalid schedules', () => {
    expect(() =>
      readSourceConfigs(
        new ConfigReader({
          npxSkillConnector: {
            sources: [
              {
                id: 'test',
                indexUrl: 'https://example.com/index.json',
                schedule: {
                  frequency: 'bogus',
                  timeout: { minutes: 1 },
                },
              },
            ],
          },
        }),
      ),
    ).toThrow('schedule');
  });
});

describe('readSourceSchedule', () => {
  it('defaults to a local ten-minute schedule with immediate first run', () => {
    expect(readSourceSchedule()).toEqual({
      frequency: { minutes: 10 },
      timeout: { milliseconds: 600000 },
      initialDelay: { seconds: 0 },
      scope: 'local',
    });
  });

  it('parses standard scheduler frequency', () => {
    const schedule = readSourceSchedule(
      new ConfigReader({
        schedule: {
          frequency: { minutes: 2 },
          timeout: 'PT30S',
          initialDelay: { seconds: 5 },
        },
      }),
    );
    expect(schedule).toEqual({
      frequency: { minutes: 2 },
      timeout: { seconds: 30 },
      initialDelay: { seconds: 5 },
      scope: 'local',
    });
  });

  it('rejects global scope', () => {
    expect(() =>
      readSourceSchedule(
        new ConfigReader({
          schedule: {
            frequency: { minutes: 1 },
            timeout: { minutes: 2 },
            scope: 'global',
          },
        }),
      ),
    ).toThrow('local');
  });
});

describe('origin validation', () => {
  it.each([
    'http://cdn.example.com',
    'https://cdn.example.com/path',
    'https://user:secret@cdn.example.com',
    'https://localhost',
    'https://127.0.0.1',
    'https://cdn.example.com?q=1',
    'not-a-url',
  ])('rejects unsafe origin %s at startup', origin => {
    expect(() =>
      readSourceConfigs(
        new ConfigReader({
          npxSkillConnector: {
            sources: [
              {
                id: 'test',
                indexUrl: 'https://example.com/index.json',
                allowedOrigins: [origin],
              },
            ],
          },
        }),
      ),
    ).toThrow('allowedOrigins');
  });

  it('normalizes and retains explicitly configured HTTPS origins', () => {
    const sources = readSourceConfigs(
      new ConfigReader({
        npxSkillConnector: {
          sources: [
            {
              id: 'test',
              indexUrl: 'https://example.com/index.json',
              allowedOrigins: ['https://CDN.example.com:443/'],
            },
          ],
        },
      }),
    );
    expect(sources[0].allowedOrigins).toEqual(['https://cdn.example.com']);
  });
});

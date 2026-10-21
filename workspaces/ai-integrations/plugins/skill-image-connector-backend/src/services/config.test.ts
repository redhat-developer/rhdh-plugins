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
import { InputError } from '@backstage/errors';
import { mockServices } from '@backstage/backend-test-utils';
import {
  readCatalogProviderPluginId,
  readMaxRetainedMarkdownSizeBytes,
  readSkillImageOptions,
  readSourceConfigs,
  readSourceSchedule,
} from './config';

describe('readSkillImageOptions', () => {
  it('preserves defaults when configuration is absent', () => {
    expect(readSkillImageOptions(new ConfigReader({}))).toEqual({
      fetchTimeoutMs: 30000,
      maxBlobSizeBytes: 5242880,
      maxAggregateContentSizeBytes: 52428800,
      maxImageWorkBudgetBytes: 52428800,
      maxDiscoveryResponseSizeBytes: 5242880,
      maxImages: 25,
      maxRetries: 2,
      retryBaseDelayMs: 2000,
      sourceOperationDeadlineMs: 300000,
    });
  });
  it('resolves overrides independently and preserves zero retries', () => {
    const overrides = {
      fetchTimeoutMs: 60000,
      maxBlobSizeBytes: 100,
      maxAggregateContentSizeBytes: 500,
      maxImageWorkBudgetBytes: 1000,
      maxDiscoveryResponseSizeBytes: 200,
      maxImages: 100,
      maxRetries: 0,
      retryBaseDelayMs: 10,
      sourceOperationDeadlineMs: 120000,
    };
    expect(
      readSkillImageOptions(
        new ConfigReader({ skillImageConnector: overrides }),
      ),
    ).toEqual(overrides);
    const defaults = readSkillImageOptions(
      new ConfigReader({ skillImageConnector: {} }),
    );
    expect(defaults.fetchTimeoutMs).toBe(30000);
    expect(defaults.maxRetries).toBe(2);
  });
  it('accepts numeric environment substitutions and Backstage null-as-unset', () => {
    const options = readSkillImageOptions(
      new ConfigReader({
        skillImageConnector: {
          fetchTimeoutMs: '60000',
          maxBlobSizeBytes: null,
        },
      }),
    );
    expect(options.fetchTimeoutMs).toBe(60000);
    expect(options.maxBlobSizeBytes).toBe(5242880);
  });
  it.each([
    ['fetchTimeoutMs', 0],
    ['fetchTimeoutMs', 2147483648],
    ['retryBaseDelayMs', 2147483648],
    ['retryBaseDelayMs', 0],
    ['maxBlobSizeBytes', -1],
    ['maxBlobSizeBytes', 1.5],
    ['maxAggregateContentSizeBytes', 0],
    ['maxImageWorkBudgetBytes', 0],
    ['maxImageWorkBudgetBytes', -1],
    ['maxDiscoveryResponseSizeBytes', 0],
    ['sourceOperationDeadlineMs', 0],
    ['sourceOperationDeadlineMs', 2147483648],
    ['maxImages', 0],
    ['maxImages', -1],
    ['maxImages', 1.5],
    ['maxImages', Number.MAX_SAFE_INTEGER + 1],
    ['maxRetries', -1],
    ['maxRetries', 1.5],
    ['maxRetries', Number.MAX_SAFE_INTEGER + 1],
    ['fetchTimeoutMs', 'not-a-number'],
  ])('rejects invalid %s = %p instead of falling back', (key, value) => {
    expect(() =>
      readSkillImageOptions(
        new ConfigReader({ skillImageConnector: { [key]: value } }),
      ),
    ).toThrow(key);
  });
});

describe('trusted redirect origin configuration', () => {
  it.each([
    { allowedOrigins: ['http://localhost'] },
    { allowedOrigins: ['https://operator:secret@example.com'] },
    { allowedOrigins: ['https://cdn.example.com'] },
    { allowedOrigins: 'invalid-array' },
  ])(
    'ignores flat origins when explicit sources own redirect trust: %j',
    ({ allowedOrigins }) => {
      const options = readSkillImageOptions(
        new ConfigReader({
          skillImageConnector: {
            allowedOrigins,
            maxImages: 100,
            sources: [
              { id: 'one', allowedOrigins: ['https://source.example.com'] },
            ],
          },
        }),
      );
      expect(options.allowedOrigins).toBeUndefined();
      expect(options.maxImages).toBe(100);
    },
  );

  it('normalizes and retains explicitly configured HTTPS origins', () => {
    expect(
      readSkillImageOptions(
        new ConfigReader({
          skillImageConnector: {
            allowedOrigins: ['https://CDN.example.com:443/'],
          },
        }),
      ).allowedOrigins,
    ).toEqual(['https://cdn.example.com']);
  });
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
      readSkillImageOptions(
        new ConfigReader({
          skillImageConnector: {
            allowedOrigins: [origin],
          },
        }),
      ),
    ).toThrow('allowedOrigins');
  });
});

describe('origin validation diagnostics', () => {
  it.each([
    ['http://cdn.example.com', 'Registry request must use HTTPS'],
    [
      'https://cdn.example.com/docs',
      'Allowed origin must not contain a path, query, or fragment',
    ],
    [
      'https://operator:secret@cdn.example.com',
      'Registry request URL must not contain embedded credentials',
    ],
  ])(
    'preserves the validation reason without exposing the origin: %s',
    (origin, reason) => {
      const options = new ConfigReader({
        skillImageConnector: { allowedOrigins: [origin] },
      });
      let failure: unknown;
      try {
        readSkillImageOptions(options);
      } catch (error) {
        failure = error;
      }
      expect(failure).toBeInstanceOf(Error);
      expect((failure as Error).message).toBe(
        `skillImageConnector.allowedOrigins: ${reason}`,
      );
    },
  );
});

describe('source-specific settings', () => {
  it('validates redirect origins with the source path', () => {
    expect(() =>
      readSourceConfigs(
        new ConfigReader({
          skillImageConnector: {
            sources: [{ id: 'bad', allowedOrigins: ['http://localhost'] }],
          },
        }),
      ),
    ).toThrow('skillImageConnector.sources[0].allowedOrigins');
  });
  it('reports the source path for obsolete refresh intervals', () => {
    expect(() =>
      readSourceConfigs(
        new ConfigReader({
          skillImageConnector: {
            sources: [{ id: 'bad', refreshIntervalMinutes: 0 }],
          },
        }),
      ),
    ).toThrow('skillImageConnector.sources[0].refreshIntervalMinutes');
  });
});

describe('Backstage source schedules', () => {
  it('defaults to a local ten-minute schedule with immediate first run', () => {
    expect(readSourceSchedule()).toEqual({
      frequency: { minutes: 10 },
      timeout: { milliseconds: 600000 },
      initialDelay: { seconds: 0 },
      scope: 'local',
    });
  });

  it.each([
    [{ minutes: 2 }, { minutes: 2 }],
    ['PT2M', { minutes: 2 }],
    ['2 minutes', { minutes: 2 }],
    [{ cron: '*/2 * * * *' }, { cron: '*/2 * * * *' }],
    [{ trigger: 'manual' }, { trigger: 'manual' }],
  ])('parses standard scheduler frequency %j', (frequency, expected) => {
    const schedule = readSourceSchedule(
      new ConfigReader({
        schedule: {
          frequency,
          timeout: 'PT30S',
          initialDelay: { seconds: 5 },
        },
      }),
    );
    expect(schedule).toEqual({
      frequency: expected,
      timeout: { seconds: 30 },
      initialDelay: { seconds: 5 },
      scope: 'local',
    });
  });

  it('parses ISO initial delays and defaults omitted delay to zero', () => {
    expect(
      readSourceSchedule(
        new ConfigReader({
          schedule: {
            frequency: { minutes: 1 },
            timeout: { minutes: 2 },
            initialDelay: 'PT5S',
            scope: 'local',
          },
        }),
      ).initialDelay,
    ).toEqual({ seconds: 5 });
    expect(
      readSourceSchedule(
        new ConfigReader({
          schedule: {
            frequency: { minutes: 1 },
            timeout: { minutes: 2 },
          },
        }),
      ).initialDelay,
    ).toEqual({ seconds: 0 });
  });

  it.each([
    {},
    { frequency: { minutes: 1 } },
    { timeout: { minutes: 1 } },
    { frequency: 'bogus', timeout: { minutes: 1 } },
    { frequency: { minutes: 1 }, timeout: 'bogus' },
    {
      frequency: { minutes: 1 },
      timeout: { minutes: 1 },
      initialDelay: 'bogus',
    },
  ])(
    'rejects malformed provided schedules with the source path: %j',
    schedule => {
      expect(() =>
        readSourceSchedule(
          new ConfigReader({ schedule }),
          'skillImageConnector.sources[2]',
        ),
      ).toThrow('skillImageConnector.sources[2].schedule');
    },
  );

  it.each(['global', 'bogus', 123])(
    'rejects unsupported scope %j with the source path',
    scope => {
      expect(() =>
        readSourceSchedule(
          new ConfigReader({
            schedule: {
              frequency: { minutes: 1 },
              timeout: { minutes: 2 },
              scope,
            },
          }),
          'skillImageConnector.sources[2]',
        ),
      ).toThrow('skillImageConnector.sources[2].schedule');
    },
  );

  it('omits untrusted schedule values from configuration diagnostics', () => {
    const secret = 'https://user:secret@example.com';
    let failure: unknown;
    try {
      readSourceSchedule(
        new ConfigReader({
          schedule: {
            frequency: secret,
            timeout: { minutes: 2 },
          },
        }),
        'skillImageConnector.sources[2]',
      );
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toContain(
      'skillImageConnector.sources[2].schedule',
    );
    expect((failure as Error).message).not.toContain(secret);
  });

  it.each([0, 10, '5'])(
    'rejects the obsolete refreshIntervalMinutes setting with migration guidance: %j',
    value => {
      expect(() =>
        readSourceSchedule(new ConfigReader({ refreshIntervalMinutes: value })),
      ).toThrow('refreshIntervalMinutes');
      expect(() =>
        readSourceSchedule(new ConfigReader({ refreshIntervalMinutes: value })),
      ).toThrow('schedule');
    },
  );

  it.each([
    [5000, 60000],
    [300000, 600000],
    [900000, 1800000],
  ])(
    'derives the default timeout from a %i ms source deadline',
    (deadline, expectedTimeout) => {
      const sources = readSourceConfigs(
        new ConfigReader({
          skillImageConnector: {
            images: [],
            sourceOperationDeadlineMs: deadline,
          },
        }),
      );
      expect(sources[0].schedule.timeout).toEqual({
        milliseconds: expectedTimeout,
      });
    },
  );

  it('reads a flat legacy source schedule', () => {
    const sources = readSourceConfigs(
      new ConfigReader({
        skillImageConnector: {
          images: [],
          schedule: { frequency: 'PT3M', timeout: 'PT2M' },
        },
      }),
    );
    expect(sources[0]).toMatchObject({
      id: 'default',
      schedule: {
        frequency: { minutes: 3 },
        timeout: { minutes: 2 },
        scope: 'local',
      },
    });
  });

  it('isolates explicit source schedules and ignores the top-level schedule', () => {
    const sources = readSourceConfigs(
      new ConfigReader({
        skillImageConnector: {
          schedule: {
            frequency: 'invalid',
            timeout: 'invalid',
            scope: 'global',
          },
          sourceOperationDeadlineMs: 900000,
          sources: [
            {
              id: 'one',
              schedule: { frequency: { cron: '0 * * * *' }, timeout: 'PT1M' },
            },
            { id: 'two' },
          ],
        },
      }),
    );
    expect(sources[0].schedule.frequency).toEqual({ cron: '0 * * * *' });
    expect(sources[1].schedule).toEqual({
      frequency: { minutes: 10 },
      timeout: { milliseconds: 1800000 },
      initialDelay: { seconds: 0 },
      scope: 'local',
    });
  });
});

describe('mixed source configuration diagnostics', () => {
  it('warns once with ignored field names without disclosing their values', () => {
    const logger = mockServices.logger.mock();
    const secret = 'private-token';
    const sources = readSourceConfigs(
      new ConfigReader({
        skillImageConnector: {
          sources: [{ id: 'one' }],
          images: [
            {
              imageRef: 'quay.io/private/image:v1',
              credentials: { password: secret },
            },
          ],
          quayDiscovery: { organization: 'private-org' },
          allowedRegistries: ['private.example.com'],
          allowedOrigins: ['https://private.example.com'],
          schedule: { frequency: 'PT3M', timeout: 'PT2M' },
        },
      }),
      logger,
    );
    expect(sources).toHaveLength(1);
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      'Ignoring flat skillImageConnector settings because sources is configured: images, quayDiscovery, allowedRegistries, allowedOrigins, schedule',
    );
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain(secret);
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain('private');
  });

  it.each([
    'images',
    'quayDiscovery',
    'allowedRegistries',
    'allowedOrigins',
    'schedule',
  ])('warns when %s alone coexists with sources', key => {
    const logger = mockServices.logger.mock();
    readSourceConfigs(
      new ConfigReader({
        skillImageConnector: {
          sources: [{ id: 'one' }],
          [key]: {},
        },
      }),
      logger,
    );
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining(key));
  });

  it.each([
    { sources: [{ id: 'one' }] },
    {
      sources: [{ id: 'one' }],
      fetchTimeoutMs: 1000,
      maxImages: 50,
      sourceOperationDeadlineMs: 120000,
    },
    {
      images: [],
      allowedRegistries: ['quay.io'],
      schedule: { frequency: 'PT3M', timeout: 'PT1M' },
    },
  ])(
    'does not warn for source-only, shared acquisition, or legacy config: %j',
    pluginConfig => {
      const logger = mockServices.logger.mock();
      readSourceConfigs(
        new ConfigReader({ skillImageConnector: pluginConfig }),
        logger,
      );
      expect(logger.warn).not.toHaveBeenCalled();
    },
  );
});

it('returns structural source settings without placeholder acquisition fields', () => {
  const config = new ConfigReader({
    skillImageConnector: { sources: [{ id: 'source' }] },
  });
  const source = readSourceConfigs(config)[0];
  expect(source.id).toBe('source');
  expect(source).not.toHaveProperty('images');
  expect(source).not.toHaveProperty('quayDiscovery');
});

it.each(['.', '..'])('rejects dot/dot-dot source ID %p (D8)', dotId => {
  const config = new ConfigReader({
    skillImageConnector: { sources: [{ id: dotId }] },
  });
  expect(() => readSourceConfigs(config)).toThrow(/must not be '\.' or '\.\.'/);
});

describe('readMaxRetainedMarkdownSizeBytes', () => {
  it('returns the default 50 MiB when not configured', () => {
    expect(readMaxRetainedMarkdownSizeBytes(new ConfigReader({}))).toBe(
      52428800,
    );
  });

  it('returns the configured value', () => {
    expect(
      readMaxRetainedMarkdownSizeBytes(
        new ConfigReader({
          skillImageConnector: { maxRetainedMarkdownSizeBytes: 1000000 },
        }),
      ),
    ).toBe(1000000);
  });

  it.each([0, -1, 1.5, 'abc'])('rejects invalid value %p', value => {
    expect(() =>
      readMaxRetainedMarkdownSizeBytes(
        new ConfigReader({
          skillImageConnector: { maxRetainedMarkdownSizeBytes: value },
        }),
      ),
    ).toThrow('positive safe integer');
  });
});

describe('readCatalogProviderPluginId', () => {
  it.each(['', '   '])('defaults blank value %p to catalog', value => {
    expect(
      readCatalogProviderPluginId(
        new ConfigReader({
          skillImageConnector: { catalogProviderPluginId: value },
        }),
      ),
    ).toBe('catalog');
  });

  it('trims a configured plugin ID', () => {
    expect(
      readCatalogProviderPluginId(
        new ConfigReader({
          skillImageConnector: { catalogProviderPluginId: ' catalog-custom ' },
        }),
      ),
    ).toBe('catalog-custom');
  });

  it.each([42, false, {}])('rejects wrong type %p with InputError', value => {
    expect(() =>
      readCatalogProviderPluginId(
        new ConfigReader({
          skillImageConnector: { catalogProviderPluginId: value },
        }),
      ),
    ).toThrow(InputError);
  });
  it('defaults to catalog', () => {
    expect(readCatalogProviderPluginId(new ConfigReader({}))).toBe('catalog');
  });

  it('returns configured value', () => {
    expect(
      readCatalogProviderPluginId(
        new ConfigReader({
          skillImageConnector: { catalogProviderPluginId: 'my-catalog' },
        }),
      ),
    ).toBe('my-catalog');
  });
});

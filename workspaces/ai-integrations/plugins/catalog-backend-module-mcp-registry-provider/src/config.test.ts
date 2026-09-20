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
  assertSingleRegistryConfig,
  readMaxEntries,
  readMcpRegistryProviderConfig,
  readHostAllowList,
  readOptionalPageSize,
  readPageLimit,
  readProviderSchedule,
  readRemotesOnly,
  readRequiredHttpBaseUrl,
  safeGetOptionalString,
  validateHostAllowList,
} from './config';

describe('readMcpRegistryProviderConfig', () => {
  it('returns undefined when catalog.providers is absent', () => {
    const config = new ConfigReader({});
    expect(readMcpRegistryProviderConfig(config)).toBeUndefined();
  });

  it('returns undefined when catalog.providers.mcpRegistry is absent', () => {
    const config = new ConfigReader({
      catalog: { providers: {} },
    });
    expect(readMcpRegistryProviderConfig(config)).toBeUndefined();
  });

  it('reads a single object with baseUrl and applies defaults', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          mcpRegistry: {
            baseUrl: 'https://registry.example.com',
          },
        },
      },
    });

    const result = readMcpRegistryProviderConfig(config);
    expect(result).toBeDefined();
    expect(result!.baseUrl).toBe('https://registry.example.com');
    expect(result!.apiVersion).toBe('v1');
    expect(result!.pageLimit).toBe(10);
    expect(result!.maxEntries).toBe(5000);
    expect(result!.remotesOnly).toBe(false);
    expect(result!.pageSize).toBeUndefined();
    expect(result!.baseName).toBeUndefined();
    expect(result!.defaultOwner).toBeUndefined();
    expect(result!.schedule).toEqual({
      frequency: { minutes: 30 },
      timeout: { minutes: 3 },
    });
  });

  it('reads optional baseName', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          mcpRegistry: {
            baseUrl: 'https://registry.example.com',
            baseName: 'com.example.registry',
          },
        },
      },
    });

    const result = readMcpRegistryProviderConfig(config);
    expect(result!.baseName).toBe('com.example.registry');
  });

  it('reads explicit pageLimit override', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          mcpRegistry: {
            baseUrl: 'https://registry.example.com',
            pageLimit: 3,
          },
        },
      },
    });

    const result = readMcpRegistryProviderConfig(config);
    expect(result!.pageLimit).toBe(3);
  });

  it('reads explicit pageSize', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          mcpRegistry: {
            baseUrl: 'https://registry.example.com',
            pageSize: 50,
          },
        },
      },
    });

    const result = readMcpRegistryProviderConfig(config);
    expect(result!.pageSize).toBe(50);
  });

  it('reads omitted pageSize as undefined', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          mcpRegistry: {
            baseUrl: 'https://registry.example.com',
          },
        },
      },
    });

    const result = readMcpRegistryProviderConfig(config);
    expect(result!.pageSize).toBeUndefined();
  });

  it('throws when baseUrl is missing', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          mcpRegistry: {
            apiVersion: 'v0',
          },
        },
      },
    });

    expect(() => readMcpRegistryProviderConfig(config)).toThrow(
      /missing required "baseUrl"/,
    );
  });

  it('throws when config is a keyed map of instances', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          mcpRegistry: {
            internal: {
              baseUrl: 'https://internal-registry.example.com',
            },
            public: {
              baseUrl: 'https://public-registry.example.com',
            },
          },
        },
      },
    });

    expect(() => readMcpRegistryProviderConfig(config)).toThrow(
      /found keyed instance/,
    );
  });

  it('reads a custom schedule', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          mcpRegistry: {
            baseUrl: 'https://registry.example.com',
            schedule: {
              frequency: { minutes: 15 },
              timeout: { minutes: 5 },
              initialDelay: { seconds: 30 },
            },
          },
        },
      },
    });

    const result = readMcpRegistryProviderConfig(config);
    expect(result!.schedule).toEqual({
      frequency: { minutes: 15 },
      timeout: { minutes: 5 },
      initialDelay: { seconds: 30 },
    });
  });

  it('reads defaultOwner', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          mcpRegistry: {
            baseUrl: 'https://registry.example.com',
            defaultOwner: 'group:default/mcp-admins',
          },
        },
      },
    });

    const result = readMcpRegistryProviderConfig(config);
    expect(result!.defaultOwner).toBe('group:default/mcp-admins');
  });

  it('reads apiVersion override', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          mcpRegistry: {
            baseUrl: 'https://registry.example.com',
            apiVersion: 'v0',
          },
        },
      },
    });

    const result = readMcpRegistryProviderConfig(config);
    expect(result!.apiVersion).toBe('v0');
  });

  it('reads hostAllowList when provided', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          mcpRegistry: {
            baseUrl: 'https://registry.example.com',
            hostAllowList: ['registry.example.com'],
          },
        },
      },
    });

    const result = readMcpRegistryProviderConfig(config);
    expect(result!.hostAllowList).toEqual(['registry.example.com']);
  });

  it('returns undefined hostAllowList when omitted', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          mcpRegistry: {
            baseUrl: 'https://registry.example.com',
          },
        },
      },
    });

    const result = readMcpRegistryProviderConfig(config);
    expect(result!.hostAllowList).toBeUndefined();
  });

  it('throws when baseUrl hostname is not in hostAllowList', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          mcpRegistry: {
            baseUrl: 'https://registry.example.com',
            hostAllowList: ['other.example.com'],
          },
        },
      },
    });

    expect(() => readMcpRegistryProviderConfig(config)).toThrow(
      /not in the configured hostAllowList/,
    );
  });

  it('normalizes hostAllowList entries to lowercase', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          mcpRegistry: {
            baseUrl: 'https://Registry.Example.COM',
            hostAllowList: ['REGISTRY.EXAMPLE.COM'],
          },
        },
      },
    });

    const result = readMcpRegistryProviderConfig(config);
    expect(result!.hostAllowList).toEqual(['registry.example.com']);
  });
});

describe('safeGetOptionalString', () => {
  it('returns the string value when present', () => {
    const config = new ConfigReader({
      baseUrl: 'https://registry.example.com',
    });
    expect(safeGetOptionalString(config, 'baseUrl')).toBe(
      'https://registry.example.com',
    );
  });

  it('returns undefined when the key is absent', () => {
    const config = new ConfigReader({});
    expect(safeGetOptionalString(config, 'baseUrl')).toBeUndefined();
  });

  it('returns undefined when ConfigReader rejects an empty string', () => {
    const config = new ConfigReader({ baseUrl: '' });
    expect(safeGetOptionalString(config, 'baseUrl')).toBeUndefined();
  });
});

describe('assertSingleRegistryConfig', () => {
  it('allows a flat single-registry object', () => {
    const config = new ConfigReader({
      baseUrl: 'https://registry.example.com',
      apiVersion: 'v1',
    });
    expect(() => assertSingleRegistryConfig(config)).not.toThrow();
  });

  it('ignores unknown scalar keys', () => {
    const config = new ConfigReader({
      baseUrl: 'https://registry.example.com',
      extraFlag: true,
    });
    expect(() => assertSingleRegistryConfig(config)).not.toThrow();
  });

  it('throws when an unknown key is a nested instance object', () => {
    const config = new ConfigReader({
      internal: {
        baseUrl: 'https://internal.example.com',
      },
    });
    expect(() => assertSingleRegistryConfig(config)).toThrow(
      /found keyed instance/,
    );
  });
});

describe('readRequiredHttpBaseUrl', () => {
  it('returns a valid https baseUrl', () => {
    const config = new ConfigReader({
      baseUrl: 'https://registry.example.com',
    });
    expect(readRequiredHttpBaseUrl(config)).toBe(
      'https://registry.example.com',
    );
  });

  it('returns a valid http baseUrl', () => {
    const config = new ConfigReader({
      baseUrl: 'http://localhost:8080',
    });
    expect(readRequiredHttpBaseUrl(config)).toBe('http://localhost:8080');
  });

  it('throws when baseUrl is missing', () => {
    const config = new ConfigReader({});
    expect(() => readRequiredHttpBaseUrl(config)).toThrow(
      /missing required "baseUrl"/,
    );
  });

  it('throws when baseUrl is not a valid URL', () => {
    const config = new ConfigReader({ baseUrl: 'not a url' });
    expect(() => readRequiredHttpBaseUrl(config)).toThrow(/is not a valid URL/);
  });

  it('throws when baseUrl uses a non-http protocol', () => {
    const config = new ConfigReader({ baseUrl: 'ftp://registry.example.com' });
    expect(() => readRequiredHttpBaseUrl(config)).toThrow(
      /must use http or https protocol/,
    );
  });
});

describe('readPageLimit', () => {
  it('defaults to 10 when omitted', () => {
    expect(readPageLimit(new ConfigReader({}))).toBe(10);
  });

  it('returns an explicit pageLimit', () => {
    expect(readPageLimit(new ConfigReader({ pageLimit: 3 }))).toBe(3);
  });

  it('throws when pageLimit is less than 1', () => {
    expect(() => readPageLimit(new ConfigReader({ pageLimit: 0 }))).toThrow(
      /"pageLimit" must be at least 1/,
    );
  });
});

describe('readOptionalPageSize', () => {
  it('returns undefined when omitted', () => {
    expect(readOptionalPageSize(new ConfigReader({}))).toBeUndefined();
  });

  it('returns an explicit pageSize', () => {
    expect(readOptionalPageSize(new ConfigReader({ pageSize: 50 }))).toBe(50);
  });

  it('throws when pageSize is less than 1', () => {
    expect(() =>
      readOptionalPageSize(new ConfigReader({ pageSize: 0 })),
    ).toThrow(/"pageSize" must be at least 1/);
  });
});

describe('readMaxEntries', () => {
  it('defaults to 5000 when omitted', () => {
    expect(readMaxEntries(new ConfigReader({}))).toBe(5000);
  });

  it('returns an explicit maxEntries', () => {
    expect(readMaxEntries(new ConfigReader({ maxEntries: 1000 }))).toBe(1000);
  });

  it('throws when maxEntries is less than 1', () => {
    expect(() => readMaxEntries(new ConfigReader({ maxEntries: 0 }))).toThrow(
      /"maxEntries" must be at least 1/,
    );
  });
});

describe('readRemotesOnly', () => {
  it('defaults to false when omitted', () => {
    expect(readRemotesOnly(new ConfigReader({}))).toBe(false);
  });

  it('returns true when remotesOnly is true', () => {
    expect(readRemotesOnly(new ConfigReader({ remotesOnly: true }))).toBe(true);
  });

  it('returns false when remotesOnly is false', () => {
    expect(readRemotesOnly(new ConfigReader({ remotesOnly: false }))).toBe(
      false,
    );
  });
});

describe('readHostAllowList', () => {
  it('returns undefined when omitted', () => {
    expect(readHostAllowList(new ConfigReader({}))).toBeUndefined();
  });

  it('returns an empty array for an empty array (deny all)', () => {
    expect(readHostAllowList(new ConfigReader({ hostAllowList: [] }))).toEqual(
      [],
    );
  });

  it('returns normalized lowercase hostnames', () => {
    expect(
      readHostAllowList(
        new ConfigReader({
          hostAllowList: ['Registry.Example.COM', 'Other.HOST'],
        }),
      ),
    ).toEqual(['registry.example.com', 'other.host']);
  });
});

describe('validateHostAllowList', () => {
  it('passes when hostname is in the allow list', () => {
    expect(() =>
      validateHostAllowList('https://registry.example.com/path', [
        'registry.example.com',
      ]),
    ).not.toThrow();
  });

  it('throws when hostname is not in the allow list', () => {
    expect(() =>
      validateHostAllowList('https://evil.example.com', [
        'registry.example.com',
      ]),
    ).toThrow(/not in the configured hostAllowList/);
  });

  it('matches case-insensitively', () => {
    expect(() =>
      validateHostAllowList('https://Registry.Example.COM', [
        'registry.example.com',
      ]),
    ).not.toThrow();
  });
});

describe('readProviderSchedule', () => {
  it('returns the default schedule when omitted', () => {
    expect(readProviderSchedule(new ConfigReader({}))).toEqual({
      frequency: { minutes: 30 },
      timeout: { minutes: 3 },
    });
  });

  it('reads an explicit schedule', () => {
    const config = new ConfigReader({
      schedule: {
        frequency: { minutes: 15 },
        timeout: { minutes: 5 },
        initialDelay: { seconds: 30 },
      },
    });
    expect(readProviderSchedule(config)).toEqual({
      frequency: { minutes: 15 },
      timeout: { minutes: 5 },
      initialDelay: { seconds: 30 },
    });
  });
});

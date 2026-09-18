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
import { readMcpRegistryProviderConfig } from './config';

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
      /Multiple registries are out of scope/,
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
});

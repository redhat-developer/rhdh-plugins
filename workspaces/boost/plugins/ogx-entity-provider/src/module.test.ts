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
import { loadConfigSchema } from '@backstage/config-loader';
import { resolve } from 'node:path';

import { readOgxEntityProviderConfig } from './module';

describe('readOgxEntityProviderConfig', () => {
  it('reads TLS settings from ai-catalog.entityProviders.ogx', () => {
    const config = new ConfigReader({
      'ai-catalog': {
        entityProviders: {
          ogx: {
            baseUrl: 'https://ogx.example.com',
            caData:
              '-----BEGIN CERTIFICATE-----\nMIIBxTCC...\n-----END CERTIFICATE-----',
            skipTLSVerify: true,
          },
        },
      },
    });

    const result = readOgxEntityProviderConfig(config);

    expect(result.baseUrl).toBe('https://ogx.example.com');
    expect(result.caData).toBe(
      '-----BEGIN CERTIFICATE-----\nMIIBxTCC...\n-----END CERTIFICATE-----',
    );
    expect(result.skipTLSVerify).toBe(true);
  });

  it('reads agent configuration from ai-catalog.entityProviders.ogx', () => {
    const config = new ConfigReader({
      'ai-catalog': {
        entityProviders: {
          ogx: {
            baseUrl: 'https://ogx.example.com',
            defaultAgent: 'router',
            maxAgentTurns: 5,
            agents: [
              {
                id: 'router',
                name: 'Router',
                version: '1.2.3',
                model: 'granite-8b',
                tools: ['web-search'],
                description: 'Entry-point agent',
                instructions: 'Route the request',
                handoffs: ['helper'],
                handoffDescription: 'Delegate specialist requests',
                enableRAG: false,
                createdBy: 'user:default/admin',
                lifecycleStage: 'published',
              },
            ],
          },
        },
      },
    });

    const result = readOgxEntityProviderConfig(config);

    expect(result.defaultAgent).toBe('router');
    expect(result.maxAgentTurns).toBe(5);
    expect(result.agents).toEqual([
      {
        id: 'router',
        name: 'Router',
        version: '1.2.3',
        model: 'granite-8b',
        tools: ['web-search'],
        description: 'Entry-point agent',
        instructions: 'Route the request',
        handoffs: ['helper'],
        handoffDescription: 'Delegate specialist requests',
        enableRAG: false,
        createdBy: 'user:default/admin',
        lifecycleStage: 'published',
      },
    ]);
  });

  it('treats empty optional environment values as undefined', () => {
    const config = new ConfigReader({
      'ai-catalog': {
        entityProviders: {
          ogx: {
            baseUrl: 'http://localhost:8321',
            apiKey: '',
            agents: [
              {
                id: 'empty-agent',
                name: 'Empty Agent',
                version: '',
                description: '',
              },
            ],
          },
        },
      },
    });

    const result = readOgxEntityProviderConfig(config);

    expect(result.apiKey).toBeUndefined();
    expect(result.agents?.[0]).toMatchObject({
      version: undefined,
      description: undefined,
    });
  });

  it('falls back to localhost when no OGX config is present', () => {
    const result = readOgxEntityProviderConfig(new ConfigReader({}));

    expect(result).toEqual({ baseUrl: 'http://localhost:8321' });
  });

  it('requires a base URL when the new configuration block exists', () => {
    const config = new ConfigReader({
      'ai-catalog': { entityProviders: { ogx: { apiKey: 'example-key' } } },
    });

    expect(() => readOgxEntityProviderConfig(config)).toThrow('baseUrl');
  });

  it('reads refresh intervals and credentials from the new namespace', () => {
    const config = new ConfigReader({
      'ai-catalog': {
        entityProviders: {
          ogx: {
            baseUrl: 'https://ogx.example.com',
            apiKey: 'example-key',
            modelRefreshIntervalSeconds: 120,
            agentRefreshIntervalSeconds: 600,
            skipTLSVerify: false,
          },
        },
      },
    });

    expect(readOgxEntityProviderConfig(config)).toMatchObject({
      apiKey: 'example-key',
      modelRefreshIntervalSeconds: 120,
      agentRefreshIntervalSeconds: 600,
      skipTLSVerify: false,
      caData: undefined,
    });
  });

  it('ignores legacy Boost configuration namespaces', () => {
    const config = new ConfigReader({
      boost: {
        entityProviders: {
          ogx: { baseUrl: 'https://legacy-entity-provider.example.com' },
        },
        providers: {
          ogx: { baseUrl: 'https://legacy-provider.example.com' },
        },
      },
    });

    const result = readOgxEntityProviderConfig(config);

    expect(result).toEqual({ baseUrl: 'http://localhost:8321' });
  });

  it('prefers the AI Catalog namespace when legacy and new values coexist', () => {
    const config = new ConfigReader({
      boost: {
        entityProviders: {
          ogx: { baseUrl: 'https://legacy.example.com', apiKey: 'legacy-key' },
        },
        providers: {
          ogx: {
            baseUrl: 'https://legacy-provider.example.com',
            caData: 'legacy-ca',
          },
        },
      },
      'ai-catalog': {
        entityProviders: {
          ogx: { baseUrl: 'https://ai-catalog.example.com' },
        },
      },
    });

    const result = readOgxEntityProviderConfig(config);

    expect(result.baseUrl).toBe('https://ai-catalog.example.com');
    expect(result.apiKey).toBeUndefined();
    expect(result.caData).toBeUndefined();
  });
});

describe('standalone OGX configuration schema', () => {
  it('validates the renamed namespace and keeps credentials and backend settings out of frontend config', async () => {
    const schema = await loadConfigSchema({
      dependencies: [],
      packagePaths: [resolve(__dirname, '../package.json')],
      excludePackageDependencies: true,
    });
    const data = {
      'ai-catalog': {
        entityProviders: {
          ogx: {
            baseUrl: 'https://ogx.example.com',
            apiKey: 'example-key',
            caData: 'example-ca',
            skipTLSVerify: false,
            modelRefreshIntervalSeconds: 120,
            agentRefreshIntervalSeconds: 600,
          },
        },
      },
    };
    const configs = [{ context: 'test', data }];

    expect(schema.process(configs)[0].data).toEqual(data);
    expect(
      schema.process(configs, { visibility: ['frontend'] })[0].data,
    ).toEqual({});
    const backend = new ConfigReader(
      schema.process(configs, { visibility: ['backend'] })[0].data,
    );
    expect(
      backend.getOptionalString('ai-catalog.entityProviders.ogx.apiKey'),
    ).toBeUndefined();
    expect(backend.getString('ai-catalog.entityProviders.ogx.caData')).toBe(
      'example-ca',
    );
    expect(schema.serialize()).toMatchObject({
      schemas: [
        { value: { properties: { 'ai-catalog': expect.any(Object) } } },
      ],
    });
    expect(JSON.stringify(schema.serialize())).not.toContain('"boost"');
    expect(() =>
      schema.process([
        {
          context: 'test',
          data: {
            'ai-catalog': {
              entityProviders: {
                ogx: {
                  baseUrl: 'https://ogx.example.com',
                  skipTLSVerify: 'invalid',
                },
              },
            },
          },
        },
      ]),
    ).toThrow();
  });
});

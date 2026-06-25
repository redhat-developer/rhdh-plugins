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

import type {
  CacheService,
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import { KagentiProviderFactory } from './KagentiProviderFactory';
import { KagentiProvider } from './KagentiProvider';
import { AgentCardCache } from './AgentCardCache';
import { KeycloakTokenCache } from './KeycloakTokenCache';
import { SessionMap } from './SessionMap';

function createMockLogger(): LoggerService {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };
}

function createMockCache(): CacheService {
  const store = new Map<string, unknown>();
  const cache: CacheService = {
    get: jest.fn(async (key: string) => store.get(key)) as CacheService['get'],
    set: jest.fn(async (key: string, value: unknown) => {
      store.set(key, value);
    }),
    delete: jest.fn(async (key: string) => {
      store.delete(key);
    }),
    withOptions: jest.fn().mockReturnThis(),
  };
  return cache;
}

function createMockConfig(
  values: Record<string, string | undefined> = {},
): RootConfigService {
  const providerConfig = values.baseUrl
    ? {
        getString: jest.fn((key: string) => {
          const val = values[key];
          if (val === undefined) {
            throw new Error(`Missing config key: ${key}`);
          }
          return val;
        }),
        getOptionalString: jest.fn((key: string) => values[key]),
      }
    : undefined;

  return {
    getString: jest.fn(),
    getOptionalString: jest.fn(),
    getOptionalConfig: jest.fn((_path: string) => providerConfig),
    getConfig: jest.fn(),
    getConfigArray: jest.fn(),
    getOptionalConfigArray: jest.fn(),
    getNumber: jest.fn(),
    getOptionalNumber: jest.fn(),
    getBoolean: jest.fn(),
    getOptionalBoolean: jest.fn(),
    getStringArray: jest.fn(),
    getOptionalStringArray: jest.fn(),
    keys: jest.fn(() => []),
    has: jest.fn(() => false),
    get: jest.fn(),
    getOptional: jest.fn(),
  } as unknown as RootConfigService;
}

describe('KagentiProviderFactory', () => {
  it('creates a provider bundle with configured endpoint', () => {
    const factory = new KagentiProviderFactory({
      config: createMockConfig({
        baseUrl: 'http://kagenti:8080',
        defaultAgent: 'my-agent',
      }),
      cache: createMockCache(),
      logger: createMockLogger(),
    });

    const bundle = factory.create();

    expect(bundle.provider).toBeInstanceOf(KagentiProvider);
    expect(bundle.agentCardCache).toBeInstanceOf(AgentCardCache);
    expect(bundle.keycloakTokenCache).toBeInstanceOf(KeycloakTokenCache);
    expect(bundle.sessionMap).toBeInstanceOf(SessionMap);
  });

  it('falls back to default connection when no config is set', () => {
    const logger = createMockLogger();
    const factory = new KagentiProviderFactory({
      config: createMockConfig(),
      cache: createMockCache(),
      logger,
    });

    const bundle = factory.create();

    expect(bundle.provider).toBeInstanceOf(KagentiProvider);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('No boost.providers.kagenti config found'),
    );
  });

  it('reads config from boost.providers.kagenti path', () => {
    const config = createMockConfig({
      baseUrl: 'http://kagenti:8080',
    });

    const factory = new KagentiProviderFactory({
      config,
      cache: createMockCache(),
      logger: createMockLogger(),
    });

    factory.create();

    expect(config.getOptionalConfig).toHaveBeenCalledWith(
      'boost.providers.kagenti',
    );
  });
});

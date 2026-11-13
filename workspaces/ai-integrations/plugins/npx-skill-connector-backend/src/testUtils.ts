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
  BackendFeature,
  LoggerService,
} from '@backstage/backend-plugin-api';
// eslint-disable-next-line @backstage/no-undeclared-imports -- Shared fixtures are imported only by tests.
import {
  mockCredentials,
  mockServices,
  startTestBackend,
} from '@backstage/backend-test-utils';
import type { Config } from '../config';
import type { NpxSourceConfig } from './services/types';

/** Minimal mock logger for tests. */
export function createMockLogger(): LoggerService {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  } as unknown as LoggerService;
}

/** Default source config for tests. */
export const testSource: NpxSourceConfig = {
  id: 'test-source',
  indexUrl: 'https://skills.example.com/index.json',
  schedule: {
    frequency: { minutes: 10 },
    timeout: { minutes: 10 },
    initialDelay: { seconds: 0 },
    scope: 'local',
  },
};

// Expand imported config interfaces into structural JSON objects accepted by
// Backstage's config test service while retaining schema checking at call sites.
type JsonConfig<T> = T extends object
  ? { [K in keyof T]: JsonConfig<T[K]> }
  : T;
export type NpxConnectorTestConfig = JsonConfig<
  NonNullable<Config['npxSkillConnector']>
>;

/** Start a connector backend for integration testing. */
export function startConnector(
  settings: NpxConnectorTestConfig,
  logger: ReturnType<typeof mockServices.logger.mock>,
  plugin: BackendFeature,
  scheduler: BackendFeature = mockServices.scheduler.factory({
    includeInitialDelayedTasksOnStartup: true,
  }),
) {
  return startTestBackend({
    features: [
      plugin,
      mockServices.rootLogger.factory(),
      logger.factory,
      scheduler,
      mockServices.httpAuth.factory({
        defaultCredentials: mockCredentials.none(),
      }),
      mockServices.rootConfig.factory({
        data: {
          app: { baseUrl: 'http://localhost:3000' },
          backend: { baseUrl: 'http://localhost:7007' },
          npxSkillConnector: settings,
        },
      }),
    ],
  });
}

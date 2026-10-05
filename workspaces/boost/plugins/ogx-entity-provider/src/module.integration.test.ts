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

import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import type {
  SchedulerServiceTaskRunner,
  SchedulerServiceTaskScheduleDefinition,
} from '@backstage/backend-plugin-api';
import {
  type EntityProvider,
  catalogProcessingExtensionPoint,
} from '@backstage/plugin-catalog-node';
import type { JsonObject } from '@backstage/types';

import { catalogModuleOgxEntityProvider } from './module';
import { OgxAgentEntityProvider } from './providers/OgxAgentEntityProvider';
import { OgxModelEntityProvider } from './providers/OgxModelEntityProvider';

const BASE_APP_CONFIG: JsonObject = {
  app: { baseUrl: 'http://localhost:3000' },
  backend: { baseUrl: 'http://localhost:7007' },
};

function aiCatalogOgxConfig(overrides?: {
  modelRefreshIntervalSeconds?: number;
  agentRefreshIntervalSeconds?: number;
  emptyCaData?: boolean;
}): JsonObject {
  return {
    ...BASE_APP_CONFIG,
    'ai-catalog': {
      entityProviders: {
        ogx: {
          baseUrl: 'https://ogx.example.com',
          apiKey: 'example-key',
          caData: overrides?.emptyCaData
            ? ''
            : '-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----',
          skipTLSVerify: false,
          modelRefreshIntervalSeconds:
            overrides?.modelRefreshIntervalSeconds ?? 120,
          agentRefreshIntervalSeconds:
            overrides?.agentRefreshIntervalSeconds ?? 600,
          defaultAgent: 'router',
          agents: [
            {
              id: 'router',
              name: 'Router',
              model: 'granite-8b',
              instructions: 'Route the request',
            },
          ],
        },
      },
    },
  };
}

function legacyBoostOgxConfig(): JsonObject {
  return {
    ...BASE_APP_CONFIG,
    boost: {
      entityProviders: {
        ogx: {
          baseUrl: 'https://legacy-entity-provider.example.com',
          agents: [{ id: 'legacy', name: 'Legacy' }],
        },
      },
      providers: {
        ogx: {
          baseUrl: 'https://legacy-provider.example.com',
        },
      },
    },
  };
}

async function startOgxModule(configData: JsonObject) {
  const schedules: SchedulerServiceTaskScheduleDefinition[] = [];
  const providers: EntityProvider[] = [];

  const scheduler = mockServices.scheduler.mock({
    createScheduledTaskRunner(
      schedule: SchedulerServiceTaskScheduleDefinition,
    ): SchedulerServiceTaskRunner {
      schedules.push(schedule);
      return { run: jest.fn() };
    },
  });

  const extensionPoint = {
    addProcessor: jest.fn(),
    addEntityProvider: (...args: EntityProvider[]) => {
      providers.push(...args);
    },
  };

  await startTestBackend({
    extensionPoints: [[catalogProcessingExtensionPoint, extensionPoint]],
    features: [
      catalogModuleOgxEntityProvider,
      mockServices.rootLogger.factory(),
      mockServices.rootConfig.factory({ data: configData }),
      scheduler.factory,
    ],
  });

  return { providers, schedules };
}

describe('catalogModuleOgxEntityProvider integration (RHIDP-17278)', () => {
  jest.setTimeout(60_000);

  it('boots and registers model + agent entity providers from ai-catalog.entityProviders.ogx', async () => {
    const { providers, schedules } = await startOgxModule(aiCatalogOgxConfig());

    expect(providers).toHaveLength(2);
    expect(providers[0]).toBeInstanceOf(OgxModelEntityProvider);
    expect(providers[1]).toBeInstanceOf(OgxAgentEntityProvider);
    expect(providers[0].getProviderName()).toBe('ogx-model-entity-provider');
    expect(providers[1].getProviderName()).toBe('ogx-agent-entity-provider');

    expect(schedules).toHaveLength(2);
    expect(schedules[0]?.frequency).toEqual({ seconds: 120 });
    expect(schedules[0]?.timeout).toEqual({ minutes: 3 });
    expect(schedules[1]?.frequency).toEqual({ seconds: 600 });
    expect(schedules[1]?.timeout).toEqual({ minutes: 5 });
  });

  it('ignores legacy boost.* namespaces and falls back to localhost defaults', async () => {
    const { providers, schedules } = await startOgxModule(
      legacyBoostOgxConfig(),
    );

    expect(providers).toHaveLength(2);
    // Defaults when ai-catalog.entityProviders.ogx is absent: 60s models / 300s agents
    expect(schedules[0]?.frequency).toEqual({ seconds: 60 });
    expect(schedules[1]?.frequency).toEqual({ seconds: 300 });
    expect(providers.map(p => p.getProviderName())).toEqual([
      'ogx-model-entity-provider',
      'ogx-agent-entity-provider',
    ]);
  });

  it('does not throw when caData is an empty string from env substitution like ${VAR:-}', async () => {
    const { providers, schedules } = await startOgxModule(
      aiCatalogOgxConfig({ emptyCaData: true }),
    );

    expect(providers).toHaveLength(2);
    expect(schedules[0]?.frequency).toEqual({ seconds: 120 });
    expect(schedules[1]?.frequency).toEqual({ seconds: 600 });
  });
});

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
  SchedulerServiceTaskInvocationDefinition,
  SchedulerServiceTaskRunner,
  SchedulerServiceTaskScheduleDefinition,
} from '@backstage/backend-plugin-api';
import { mockServices } from '@backstage/backend-test-utils';
import type { EntityProviderConnection } from '@backstage/plugin-catalog-node';

import {
  fetchModelCatalogFromKey,
  fetchModelCatalogKeys,
} from '../clients/BridgeResourceConnector';
import { ModelCatalogResourceEntityProvider } from './ModelCatalogResourceEntityProvider';
import { ModelCatalog } from '@redhat-ai-dev/model-catalog-types';

const CONFIG = {
  catalog: {
    providers: {
      modelCatalog: {
        development: {
          baseUrl: 'http://localhost:9090',
        },
      },
    },
  },
} as const;

const fakeCatalog: ModelCatalog = {
  models: [
    {
      name: 'ibm-granite',
      description: 'IBM Granite code model',
      lifecycle: 'production',
      owner: 'example-user',
    },
  ],
};

const connection = {
  applyMutation: jest.fn(),
  refresh: jest.fn(),
} as unknown as EntityProviderConnection;

jest.mock('../clients/BridgeResourceConnector', () => ({
  ...jest.requireActual('../clients/BridgeResourceConnector'),
  fetchModelCatalogKeys: jest.fn().mockReturnValue({}),
  fetchModelCatalogFromKey: jest.fn().mockReturnValue({}),
}));

class SchedulerServiceTaskRunnerMock implements SchedulerServiceTaskRunner {
  private readonly tasks: SchedulerServiceTaskInvocationDefinition[] = [];
  async run(task: SchedulerServiceTaskInvocationDefinition) {
    this.tasks.push(task);
  }
  async runAll() {
    const abortSignal = jest.fn() as unknown as AbortSignal;
    for await (const task of this.tasks) {
      await task.fn(abortSignal);
    }
  }
}

const scheduler = mockServices.scheduler.mock({
  createScheduledTaskRunner() {
    return new SchedulerServiceTaskRunnerMock();
  },
});

describe('ModelCatalogResourceEntityProvider', () => {
  let schedule: SchedulerServiceTaskRunnerMock;

  beforeEach(() => {
    jest.clearAllMocks();
    schedule = scheduler.createScheduledTaskRunner(
      '' as unknown as SchedulerServiceTaskScheduleDefinition,
    ) as SchedulerServiceTaskRunnerMock;
  });

  it('should connect', async () => {
    const mcprovider = ModelCatalogResourceEntityProvider.fromConfig(
      {
        config: mockServices.rootConfig({ data: CONFIG }),
        logger: mockServices.logger.mock(),
      },
      {
        schedule,
      },
    );

    const result = await Promise.all(
      mcprovider.map(async k => await k.connect(connection)),
    );
    expect(result).toEqual([undefined]);
  });

  /** ToDo:
   * Write more detailed tests than just validating that run() triggers mutate x times
   * 1) Ensure ingested catalog entities match what we expect
   * 2) Properly mock model catalog bridge API calls as done in the BridgeResourceConnector tests
   */
  it('should connect and run should resolve', async () => {
    (fetchModelCatalogKeys as jest.Mock).mockReturnValue(
      Promise.resolve(['ibm-granite']),
    );
    (fetchModelCatalogFromKey as jest.Mock).mockReturnValue(
      Promise.resolve(fakeCatalog),
    );

    const mcprovider = ModelCatalogResourceEntityProvider.fromConfig(
      {
        config: mockServices.rootConfig({ data: CONFIG }),
        logger: mockServices.logger.mock(),
      },
      {
        schedule,
      },
    );

    for await (const k of mcprovider) {
      await k.connect(connection);
      await schedule.runAll();
    }

    expect(connection.applyMutation).toHaveBeenCalledTimes(1);
    expect(
      (connection.applyMutation as jest.Mock).mock.calls,
    ).toMatchSnapshot();
  });

  it('should connect and run should resolve even if the keys returned are null', async () => {
    (fetchModelCatalogKeys as jest.Mock).mockReturnValue(Promise.resolve(null));

    const mcprovider = ModelCatalogResourceEntityProvider.fromConfig(
      {
        config: mockServices.rootConfig({ data: CONFIG }),
        logger: mockServices.logger.mock(),
      },
      {
        schedule,
      },
    );

    for await (const k of mcprovider) {
      await k.connect(connection);
      await schedule.runAll();
    }

    expect(connection.applyMutation).toHaveBeenCalledTimes(1);
    expect(fetchModelCatalogFromKey).toHaveBeenCalledTimes(0);
    expect(
      (connection.applyMutation as jest.Mock).mock.calls,
    ).toMatchSnapshot();
  });
});

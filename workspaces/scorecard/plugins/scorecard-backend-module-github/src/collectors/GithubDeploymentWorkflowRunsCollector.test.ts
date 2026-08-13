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

import { mockServices } from '@backstage/backend-test-utils';
import { ConfigReader } from '@backstage/config';
import { GithubClient } from '../github/GithubClient';
import { GithubDeploymentWorkflowRunsCollector } from './GithubDeploymentWorkflowRunsCollector';

const testEntity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'service-a',
    annotations: {
      'github.com/project-slug': 'owner/repo',
      'backstage.io/source-location': 'url:https://github.com/owner/repo',
    },
  },
};

describe('GithubDeploymentWorkflowRunsCollector', () => {
  let collector: GithubDeploymentWorkflowRunsCollector;
  const mockedLogger = mockServices.logger.mock();

  beforeEach(() => {
    jest.clearAllMocks();
    collector = GithubDeploymentWorkflowRunsCollector.fromConfig(
      new ConfigReader({
        integrations: {
          github: [
            {
              host: 'github.com',
              token: 'dummy-token',
            },
          ],
        },
      }),
      { logger: mockedLogger },
    );
  });

  it('collects deployments from workflow runs with success conclusion', async () => {
    const getWorkflowRunsSpy = jest
      .spyOn(GithubClient.prototype, 'getWorkflowRuns')
      .mockResolvedValue([
        {
          id: 1,
          sha: 'sha-one',
          createdAt: '2026-06-02T00:00:00.000Z',
          status: 'completed',
          conclusion: 'success',
        },
      ]);

    const result = await collector.collect({
      entity: testEntity,
      input: {
        workflowName: 'Custom deployment',
        from: '2026-06-01T00:00:00.000Z',
        to: '2026-06-08T00:00:00.000Z',
      },
    });

    expect(result).toEqual({
      deployments: [
        {
          id: '1',
          commitSha: 'sha-one',
          createdAt: '2026-06-02T00:00:00.000Z',
          result: 'success',
        },
      ],
    });
    expect(getWorkflowRunsSpy).toHaveBeenCalledTimes(1);
  });

  it('collects deployments from workflow runs with failure conclusion', async () => {
    const getWorkflowRunsSpy = jest
      .spyOn(GithubClient.prototype, 'getWorkflowRuns')
      .mockResolvedValue([
        {
          id: 2,
          sha: 'sha-timeout',
          createdAt: '2026-06-03T00:00:00.000Z',
          status: 'completed',
          conclusion: 'timed_out',
        },
      ]);

    const result = await collector.collect({
      entity: testEntity,
      input: {
        workflowName: 'Custom deployment',
        from: '2026-06-01T00:00:00.000Z',
        to: '2026-06-08T00:00:00.000Z',
      },
    });

    expect(result).toEqual({
      deployments: [
        {
          id: '2',
          commitSha: 'sha-timeout',
          createdAt: '2026-06-03T00:00:00.000Z',
          result: 'failure',
        },
      ],
    });
    expect(getWorkflowRunsSpy).toHaveBeenCalledTimes(1);
  });
});

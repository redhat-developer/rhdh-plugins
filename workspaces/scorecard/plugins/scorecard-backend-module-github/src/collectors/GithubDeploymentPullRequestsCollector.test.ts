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
import { GithubDeploymentPullRequestsCollector } from './GithubDeploymentPullRequestsCollector';

describe('GithubDeploymentPullRequestsCollector', () => {
  it('collects pull requests between two deployment commits', async () => {
    const getCommitShasBetweenSpy = jest
      .spyOn(GithubClient.prototype, 'getCommitShasBetween')
      .mockResolvedValue(['sha-two', 'sha-three']);

    const getCommitsPullRequestsSpy = jest
      .spyOn(GithubClient.prototype, 'getCommitsPullRequests')
      .mockResolvedValue(
        new Map([
          [
            'sha-two',
            [
              {
                number: 100,
                firstCommitAt: '2026-05-28T10:00:00.000Z',
              },
              { number: 101, firstCommitAt: null },
              {
                number: 102,
                firstCommitAt: '2026-05-30T10:00:00.000Z',
              },
            ],
          ],
          [
            'sha-three',
            [
              {
                number: 102,
                firstCommitAt: '2026-05-30T10:00:00.000Z',
              },
            ],
          ],
        ]),
      );
    const mockedLogger = mockServices.logger.mock();

    const collector = GithubDeploymentPullRequestsCollector.fromConfig(
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
      {
        logger: mockedLogger,
      },
    );

    const result = await collector.collect({
      entity: {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'service-a',
          annotations: {
            'github.com/project-slug': 'owner/repo',
            'backstage.io/source-location': 'url:https://github.com/owner/repo',
          },
        },
      },
      input: {
        baseCommitSha: 'sha-one',
        headCommitSha: 'sha-three',
      },
    });

    expect(result).toEqual({
      pullRequests: [
        {
          id: '100',
          firstCommitAt: '2026-05-28T10:00:00.000Z',
        },
        {
          id: '102',
          firstCommitAt: '2026-05-30T10:00:00.000Z',
        },
      ],
    });
    expect(mockedLogger.warn).toHaveBeenCalledWith(
      'Skipping pull request 101 for commit sha-two due to missing firstCommitAt',
    );
    expect(getCommitShasBetweenSpy).toHaveBeenCalledTimes(1);
    expect(getCommitsPullRequestsSpy).toHaveBeenCalledTimes(1);
    expect(getCommitsPullRequestsSpy).toHaveBeenCalledWith(
      'https://github.com/owner/repo',
      { owner: 'owner', repo: 'repo' },
      ['sha-two', 'sha-three'],
    );
  });
});

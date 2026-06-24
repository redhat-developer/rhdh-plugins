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
import type { Entity } from '@backstage/catalog-model';
import { GithubOpenPRsProvider } from './GithubOpenPRsProvider';
import { GithubClient } from '../github/GithubClient';
import { DEFAULT_NUMBER_THRESHOLDS } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

jest.mock('@backstage/catalog-model', () => ({
  ...jest.requireActual('@backstage/catalog-model'),
  getEntitySourceLocation: jest.fn().mockReturnValue({
    type: 'url',
    target: 'https://github.com/org/orgRepo/tree/main/',
  }),
}));
jest.mock('../github/GithubClient');

describe('GithubOpenPRsProvider', () => {
  describe('fromConfig', () => {
    it('should create provider with default thresholds on metric', () => {
      const provider = GithubOpenPRsProvider.fromConfig(new ConfigReader({}));
      const metrics = provider.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].threshold).toEqual(DEFAULT_NUMBER_THRESHOLDS);
    });
  });

  describe('calculateMetrics', () => {
    let provider: GithubOpenPRsProvider;
    const mockedGithubClient = GithubClient as jest.MockedClass<
      typeof GithubClient
    >;
    const mockedGithubClientInstance = {
      getOpenPullRequestsCount: jest.fn(),
    } as any;
    mockedGithubClient.mockImplementation(() => mockedGithubClientInstance);

    beforeEach(() => {
      jest.clearAllMocks();
      provider = GithubOpenPRsProvider.fromConfig(new ConfigReader({}));
    });

    it('should calculate metric', async () => {
      mockedGithubClientInstance.getOpenPullRequestsCount.mockResolvedValue(42);
      const mockEntity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'test-component',
          annotations: {
            'github.com/project-slug': 'org/orgRepo',
          },
        },
      };

      const results = await provider.calculateMetrics(mockEntity);

      expect(results.get('github.open_prs')).toBe(42);
      expect(
        mockedGithubClientInstance.getOpenPullRequestsCount,
      ).toHaveBeenCalledWith('https://github.com/org/orgRepo/tree/main/', {
        owner: 'org',
        repo: 'orgRepo',
      });
    });
  });
});

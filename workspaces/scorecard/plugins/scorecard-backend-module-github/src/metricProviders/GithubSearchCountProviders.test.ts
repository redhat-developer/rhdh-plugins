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
import { GithubOpenedIssuesProvider } from './GithubOpenedIssuesProvider';
import { GithubOpenedPRsProvider } from './GithubOpenedPRsProvider';
import { GithubClosedIssuesProvider } from './GithubClosedIssuesProvider';
import { GithubClosedPRsProvider } from './GithubClosedPRsProvider';
import { GithubClient } from '../github/GithubClient';

jest.mock('@backstage/catalog-model', () => ({
  ...jest.requireActual('@backstage/catalog-model'),
  getEntitySourceLocation: jest.fn().mockReturnValue({
    type: 'url',
    target: 'https://github.com/org/orgRepo/tree/main/',
  }),
}));
jest.mock('../github/GithubClient');

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

describe('Search count providers', () => {
  const mockedGithubClient = GithubClient as jest.MockedClass<
    typeof GithubClient
  >;
  const mockedGithubClientInstance = {
    getSearchCount: jest.fn(),
  } as any;
  mockedGithubClient.mockImplementation(() => mockedGithubClientInstance);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GithubOpenedIssuesProvider', () => {
    it('should return provider metadata', () => {
      const provider = GithubOpenedIssuesProvider.fromConfig(
        new ConfigReader({}),
      );
      expect(provider.getProviderId()).toBe('github.opened_issues_7d');
      expect(provider.getProviderDatasourceId()).toBe('github');
      expect(provider.getMetricType()).toBe('number');
    });

    it('should calculate metric using search count', async () => {
      mockedGithubClientInstance.getSearchCount.mockResolvedValue(5);
      const provider = GithubOpenedIssuesProvider.fromConfig(
        new ConfigReader({}),
      );

      const result = await provider.calculateMetric(mockEntity);

      expect(result).toBe(5);
      expect(mockedGithubClientInstance.getSearchCount).toHaveBeenCalledWith(
        'https://github.com/org/orgRepo/tree/main/',
        { owner: 'org', repo: 'orgRepo' },
        expect.stringContaining('is:issue created:>'),
      );
    });
  });

  describe('GithubOpenedPRsProvider', () => {
    it('should return provider metadata', () => {
      const provider = GithubOpenedPRsProvider.fromConfig(new ConfigReader({}));
      expect(provider.getProviderId()).toBe('github.opened_prs_7d');
    });

    it('should calculate metric using search count', async () => {
      mockedGithubClientInstance.getSearchCount.mockResolvedValue(10);
      const provider = GithubOpenedPRsProvider.fromConfig(new ConfigReader({}));

      const result = await provider.calculateMetric(mockEntity);

      expect(result).toBe(10);
      expect(mockedGithubClientInstance.getSearchCount).toHaveBeenCalledWith(
        'https://github.com/org/orgRepo/tree/main/',
        { owner: 'org', repo: 'orgRepo' },
        expect.stringContaining('is:pr created:>'),
      );
    });
  });

  describe('GithubClosedIssuesProvider', () => {
    it('should return provider metadata', () => {
      const provider = GithubClosedIssuesProvider.fromConfig(
        new ConfigReader({}),
      );
      expect(provider.getProviderId()).toBe('github.closed_issues_7d');
    });

    it('should calculate metric using search count', async () => {
      mockedGithubClientInstance.getSearchCount.mockResolvedValue(3);
      const provider = GithubClosedIssuesProvider.fromConfig(
        new ConfigReader({}),
      );

      const result = await provider.calculateMetric(mockEntity);

      expect(result).toBe(3);
      expect(mockedGithubClientInstance.getSearchCount).toHaveBeenCalledWith(
        'https://github.com/org/orgRepo/tree/main/',
        { owner: 'org', repo: 'orgRepo' },
        expect.stringContaining('is:issue is:closed closed:>'),
      );
    });
  });

  describe('GithubClosedPRsProvider', () => {
    it('should return provider metadata', () => {
      const provider = GithubClosedPRsProvider.fromConfig(new ConfigReader({}));
      expect(provider.getProviderId()).toBe('github.closed_prs_7d');
    });

    it('should calculate metric using search count', async () => {
      mockedGithubClientInstance.getSearchCount.mockResolvedValue(7);
      const provider = GithubClosedPRsProvider.fromConfig(new ConfigReader({}));

      const result = await provider.calculateMetric(mockEntity);

      expect(result).toBe(7);
      expect(mockedGithubClientInstance.getSearchCount).toHaveBeenCalledWith(
        'https://github.com/org/orgRepo/tree/main/',
        { owner: 'org', repo: 'orgRepo' },
        expect.stringContaining('is:pr is:closed closed:>'),
      );
    });
  });
});

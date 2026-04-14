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
import { GithubFilesProvider } from './GithubFilesProvider';
import { GithubClient } from '../github/GithubClient';
import { DEFAULT_FILE_CHECK_THRESHOLDS } from './GithubConfig';

jest.mock('@backstage/catalog-model', () => ({
  ...jest.requireActual('@backstage/catalog-model'),
  getEntitySourceLocation: jest.fn().mockReturnValue({
    type: 'url',
    target: 'https://github.com/org/orgRepo/tree/main/',
  }),
}));
jest.mock('../github/GithubClient');

describe('GithubFilesProvider', () => {
  describe('fromConfig', () => {
    it('should return undefined when no files configuration is provided', () => {
      const provider = GithubFilesProvider.fromConfig(new ConfigReader({}));

      expect(provider).toBeUndefined();
    });

    it('should return undefined when files array is empty', () => {
      const provider = GithubFilesProvider.fromConfig(
        new ConfigReader({
          scorecard: {
            plugins: {
              github: {
                files_check: {
                  files: [],
                },
              },
            },
          },
        }),
      );

      expect(provider).toBeUndefined();
    });

    it('should create provider with files configuration', () => {
      const config = new ConfigReader({
        scorecard: {
          plugins: {
            github: {
              files_check: {
                files: [{ readme: 'README.md' }, { license: 'LICENSE' }],
              },
            },
          },
        },
      });

      const provider = GithubFilesProvider.fromConfig(config);

      expect(provider).toBeDefined();
      expect(provider?.getMetricIds()).toEqual([
        'github.files_check.readme',
        'github.files_check.license',
      ]);
    });

    it('should throw error when file config entry has multiple key-value pairs', () => {
      const invalidConfig = new ConfigReader({
        scorecard: {
          plugins: {
            github: {
              files_check: {
                files: [{ readme: 'README.md', license: 'LICENSE' }],
              },
            },
          },
        },
      });

      expect(() => GithubFilesProvider.fromConfig(invalidConfig)).toThrow(
        'Each file config entry must have exactly one key-value pair',
      );
    });
  });

  describe('provider methods', () => {
    let provider: GithubFilesProvider;

    beforeEach(() => {
      const config = new ConfigReader({
        scorecard: {
          plugins: {
            github: {
              files_check: {
                files: [
                  { readme: 'README.md' },
                  { codeowners: 'CODEOWNERS' },
                  { dockerfile: 'Dockerfile' },
                ],
              },
            },
          },
        },
      });
      provider = GithubFilesProvider.fromConfig(config)!;
    });

    it('should return correct provider ID', () => {
      expect(provider.getProviderId()).toBe('github.files_check');
    });

    it('should return correct datasource ID', () => {
      expect(provider.getProviderDatasourceId()).toBe('github');
    });

    it('should return correct metric type', () => {
      expect(provider.getMetricType()).toBe('boolean');
    });

    it('should return all metric IDs', () => {
      expect(provider.getMetricIds()).toEqual([
        'github.files_check.readme',
        'github.files_check.codeowners',
        'github.files_check.dockerfile',
      ]);
    });

    it('should return default file check thresholds', () => {
      expect(provider.getMetricThresholds()).toEqual(
        DEFAULT_FILE_CHECK_THRESHOLDS,
      );
    });

    it('should return correct catalog filter', () => {
      expect(provider.getCatalogFilter()).toEqual({
        'metadata.annotations.github.com/project-slug': expect.any(Symbol),
      });
    });

    it('should return all metrics with correct metadata', () => {
      const metrics = provider.getMetrics();

      expect(metrics).toHaveLength(3);
      expect(metrics[0]).toEqual({
        id: 'github.files_check.readme',
        title: 'GitHub File: README.md',
        description: 'Checks if README.md exists in the repository.',
        type: 'boolean',
        history: true,
      });
      expect(metrics[1]).toEqual({
        id: 'github.files_check.codeowners',
        title: 'GitHub File: CODEOWNERS',
        description: 'Checks if CODEOWNERS exists in the repository.',
        type: 'boolean',
        history: true,
      });
    });

    it('should return first metric for backward compatibility via getMetric()', () => {
      const metric = provider.getMetric();

      expect(metric).toEqual({
        id: 'github.files_check.readme',
        title: 'GitHub File: README.md',
        description: 'Checks if README.md exists in the repository.',
        type: 'boolean',
        history: true,
      });
    });
  });

  describe('calculateMetrics', () => {
    let provider: GithubFilesProvider;
    const mockedGithubClient = GithubClient as jest.MockedClass<
      typeof GithubClient
    >;
    const mockedGithubClientInstance = {
      checkFilesExist: jest.fn(),
    } as any;
    mockedGithubClient.mockImplementation(() => mockedGithubClientInstance);

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

    beforeEach(() => {
      jest.clearAllMocks();
      const config = new ConfigReader({
        scorecard: {
          plugins: {
            github: {
              files_check: {
                files: [{ readme: 'README.md' }, { license: 'LICENSE' }],
              },
            },
          },
        },
      });
      provider = GithubFilesProvider.fromConfig(config)!;
    });

    it('should calculate metrics for all configured files', async () => {
      const mockResults = new Map<string, boolean>([
        ['github.files_check.readme', true],
        ['github.files_check.license', false],
      ]);
      mockedGithubClientInstance.checkFilesExist.mockResolvedValue(mockResults);

      const result = await provider.calculateMetrics(mockEntity);

      expect(result.get('github.files_check.readme')).toBe(true);
      expect(result.get('github.files_check.license')).toBe(false);
      expect(mockedGithubClientInstance.checkFilesExist).toHaveBeenCalledWith(
        'https://github.com/org/orgRepo/tree/main/',
        { owner: 'org', repo: 'orgRepo' },
        new Map([
          ['github.files_check.readme', 'README.md'],
          ['github.files_check.license', 'LICENSE'],
        ]),
      );
    });

    it('should return first metric result for legacy calculateMetric()', async () => {
      const mockResults = new Map<string, boolean>([
        ['github.files_check.readme', true],
        ['github.files_check.license', false],
      ]);
      mockedGithubClientInstance.checkFilesExist.mockResolvedValue(mockResults);

      const result = await provider.calculateMetric(mockEntity);

      expect(result).toBe(true);
    });

    it('should return false when metric result is not found in legacy calculateMetric()', async () => {
      const mockResults = new Map<string, boolean>();
      mockedGithubClientInstance.checkFilesExist.mockResolvedValue(mockResults);

      const result = await provider.calculateMetric(mockEntity);

      expect(result).toBe(false);
    });
  });
});

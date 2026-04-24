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
import type { UrlReaderService } from '@backstage/backend-plugin-api';
import { DEFAULT_FILECHECK_THRESHOLDS } from './FilecheckConfig';
import { createFilecheckMetricProvider } from './FilecheckMetricProviderFactory';

jest.mock('@backstage/catalog-model', () => ({
  ...jest.requireActual('@backstage/catalog-model'),
  getEntitySourceLocation: jest.fn().mockReturnValue({
    type: 'url',
    target: 'https://github.com/org/my-repo/tree/main/',
  }),
}));

/**
 * Creates a mock UrlReaderService whose readTree returns a tree containing
 * only the paths in existingFiles (filtered by the caller's filter option).
 * File paths are relative to the tree root (e.g. "README.md", not a full URL).
 */
function createMockUrlReader(
  existingFiles: Set<string>,
): jest.Mocked<UrlReaderService> {
  return {
    readUrl: jest.fn(),
    readTree: jest.fn(
      async (
        _url: string,
        opts?: {
          etag?: string;
          filter?: (path: string, info?: { size: number }) => boolean;
        },
      ) => {
        const files = [...existingFiles]
          .filter(p => !opts?.filter || opts.filter(p))
          .map(p => ({ path: p, content: async () => Buffer.from('') }));
        return {
          files: async () => files,
          etag: 'test-etag',
          archive: async () => {
            throw new Error('not implemented');
          },
        };
      },
    ),
    search: jest.fn(),
  } as unknown as jest.Mocked<UrlReaderService>;
}

const mockEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'test-component',
    annotations: {
      'backstage.io/source-location':
        'url:https://github.com/org/my-repo/tree/main/',
    },
  },
};

describe('FilecheckMetricProvider', () => {
  describe('createFilecheckMetricProvider', () => {
    const mockUrlReader = createMockUrlReader(new Set());

    it('should return undefined when no files configuration is provided', () => {
      const provider = createFilecheckMetricProvider(
        new ConfigReader({}),
        mockUrlReader,
      );
      expect(provider).toBeUndefined();
    });

    it('should return undefined when files array is empty', () => {
      const provider = createFilecheckMetricProvider(
        new ConfigReader({
          scorecard: { plugins: { filecheck: { files: [] } } },
        }),
        mockUrlReader,
      );
      expect(provider).toBeUndefined();
    });

    it('should create provider with files configuration', () => {
      const config = new ConfigReader({
        scorecard: {
          plugins: {
            filecheck: {
              files: [{ readme: 'README.md' }, { license: 'LICENSE' }],
            },
          },
        },
      });

      const provider = createFilecheckMetricProvider(config, mockUrlReader);

      expect(provider).toBeDefined();
      expect(provider?.getMetricIds()).toEqual([
        'filecheck.readme',
        'filecheck.license',
      ]);
    });

    it('should throw error when file path contains a double quote', () => {
      const config = new ConfigReader({
        scorecard: {
          plugins: {
            filecheck: { files: [{ bad: 'path/with"quote.txt' }] },
          },
        },
      });

      expect(() =>
        createFilecheckMetricProvider(config, mockUrlReader),
      ).toThrow(
        "Invalid file path for 'bad': path must not contain newlines, quotes, or backslashes",
      );
    });

    it('should throw error when file path contains a newline', () => {
      const config = new ConfigReader({
        scorecard: {
          plugins: {
            filecheck: { files: [{ bad: 'path/with\nnewline' }] },
          },
        },
      });

      expect(() =>
        createFilecheckMetricProvider(config, mockUrlReader),
      ).toThrow(
        "Invalid file path for 'bad': path must not contain newlines, quotes, or backslashes",
      );
    });

    it('should throw error when file path contains a backslash', () => {
      const config = new ConfigReader({
        scorecard: {
          plugins: {
            filecheck: {
              files: [{ bad: String.raw`path\file.txt` }],
            },
          },
        },
      });

      expect(() =>
        createFilecheckMetricProvider(config, mockUrlReader),
      ).toThrow(
        "Invalid file path for 'bad': path must not contain newlines, quotes, or backslashes",
      );
    });

    it('should throw error when file path starts with /', () => {
      const config = new ConfigReader({
        scorecard: {
          plugins: {
            filecheck: { files: [{ bad: '/absolute/path.txt' }] },
          },
        },
      });

      expect(() =>
        createFilecheckMetricProvider(config, mockUrlReader),
      ).toThrow(
        "Invalid file path for 'bad': path must be relative without leading './' or '/'",
      );
    });

    it('should throw error when file path starts with ./', () => {
      const config = new ConfigReader({
        scorecard: {
          plugins: {
            filecheck: { files: [{ bad: './relative/path.txt' }] },
          },
        },
      });

      expect(() =>
        createFilecheckMetricProvider(config, mockUrlReader),
      ).toThrow(
        "Invalid file path for 'bad': path must be relative without leading './' or '/'",
      );
    });

    it('should throw error when file config entry has multiple key-value pairs', () => {
      const config = new ConfigReader({
        scorecard: {
          plugins: {
            filecheck: {
              files: [{ readme: 'README.md', license: 'LICENSE' }],
            },
          },
        },
      });

      expect(() =>
        createFilecheckMetricProvider(config, mockUrlReader),
      ).toThrow('Each file config entry must have exactly one key-value pair');
    });
  });

  describe('provider methods', () => {
    const mockUrlReader = createMockUrlReader(new Set());

    const provider = createFilecheckMetricProvider(
      new ConfigReader({
        scorecard: {
          plugins: {
            filecheck: {
              files: [
                { readme: 'README.md' },
                { codeowners: 'CODEOWNERS' },
                { dockerfile: 'Dockerfile' },
              ],
            },
          },
        },
      }),
      mockUrlReader,
    )!;

    it('should return correct provider ID', () => {
      expect(provider.getProviderId()).toBe('filecheck');
    });

    it('should return correct datasource ID', () => {
      expect(provider.getProviderDatasourceId()).toBe('filecheck');
    });

    it('should return correct metric type', () => {
      expect(provider.getMetricType()).toBe('boolean');
    });

    it('should return all metric IDs', () => {
      expect(provider.getMetricIds()).toEqual([
        'filecheck.readme',
        'filecheck.codeowners',
        'filecheck.dockerfile',
      ]);
    });

    it('should return default file check thresholds', () => {
      expect(provider.getMetricThresholds()).toEqual(
        DEFAULT_FILECHECK_THRESHOLDS,
      );
    });

    it('should return correct catalog filter', () => {
      expect(provider.getCatalogFilter()).toEqual({
        'metadata.annotations.backstage.io/source-location': expect.any(Symbol),
      });
    });

    it('should return all metrics with correct metadata', () => {
      const metrics = provider.getMetrics();

      expect(metrics).toHaveLength(3);
      expect(metrics[0]).toEqual({
        id: 'filecheck.readme',
        title: 'File: README.md',
        description: 'Checks if README.md exists in the repository.',
        type: 'boolean',
        history: true,
      });
      expect(metrics[1]).toEqual({
        id: 'filecheck.codeowners',
        title: 'File: CODEOWNERS',
        description: 'Checks if CODEOWNERS exists in the repository.',
        type: 'boolean',
        history: true,
      });
    });

    it('should return first metric for backward compatibility via getMetric()', () => {
      const metric = provider.getMetric();

      expect(metric).toEqual({
        id: 'filecheck.readme',
        title: 'File: README.md',
        description: 'Checks if README.md exists in the repository.',
        type: 'boolean',
        history: true,
      });
    });
  });

  describe('calculateMetrics', () => {
    it('should return true for existing files and false for missing files', async () => {
      const existingFiles = new Set(['README.md']);
      const mockUrlReader = createMockUrlReader(existingFiles);

      const config = new ConfigReader({
        scorecard: {
          plugins: {
            filecheck: {
              files: [{ readme: 'README.md' }, { license: 'LICENSE' }],
            },
          },
        },
      });
      const provider = createFilecheckMetricProvider(config, mockUrlReader);

      const result = await provider?.calculateMetrics(mockEntity);

      expect(result?.get('filecheck.readme')).toBe(true);
      expect(result?.get('filecheck.license')).toBe(false);
    });

    it('should check all configured files with a single readTree call', async () => {
      const existingFiles = new Set(['README.md', 'LICENSE', 'Dockerfile']);
      const mockUrlReader = createMockUrlReader(existingFiles);

      const config = new ConfigReader({
        scorecard: {
          plugins: {
            filecheck: {
              files: [
                { readme: 'README.md' },
                { license: 'LICENSE' },
                { codeowners: 'CODEOWNERS' },
                { dockerfile: 'Dockerfile' },
              ],
            },
          },
        },
      });
      const provider = createFilecheckMetricProvider(config, mockUrlReader);

      const result = await provider?.calculateMetrics(mockEntity);

      expect(result?.get('filecheck.readme')).toBe(true);
      expect(result?.get('filecheck.license')).toBe(true);
      expect(result?.get('filecheck.codeowners')).toBe(false);
      expect(result?.get('filecheck.dockerfile')).toBe(true);
      expect(mockUrlReader.readTree).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from readTree', async () => {
      const mockUrlReader: jest.Mocked<UrlReaderService> = {
        readUrl: jest.fn(),
        readTree: jest.fn().mockRejectedValue(new Error('Auth failure')),
        search: jest.fn(),
      } as unknown as jest.Mocked<UrlReaderService>;

      const config = new ConfigReader({
        scorecard: {
          plugins: {
            filecheck: {
              files: [{ readme: 'README.md' }],
            },
          },
        },
      });
      const provider = createFilecheckMetricProvider(config, mockUrlReader);

      await expect(provider?.calculateMetrics(mockEntity)).rejects.toThrow(
        'Auth failure',
      );
    });

    it('should return first metric result for legacy calculateMetric()', async () => {
      const existingFiles = new Set(['README.md']);
      const mockUrlReader = createMockUrlReader(existingFiles);

      const config = new ConfigReader({
        scorecard: {
          plugins: {
            filecheck: {
              files: [{ readme: 'README.md' }, { license: 'LICENSE' }],
            },
          },
        },
      });
      const provider = createFilecheckMetricProvider(config, mockUrlReader);

      const result = await provider?.calculateMetric(mockEntity);

      expect(result).toBe(true);
    });

    it('should return false when metric result is not found in legacy calculateMetric()', async () => {
      const mockUrlReader = createMockUrlReader(new Set());

      const config = new ConfigReader({
        scorecard: {
          plugins: {
            filecheck: {
              files: [{ readme: 'README.md' }],
            },
          },
        },
      });
      const provider = createFilecheckMetricProvider(config, mockUrlReader);

      const result = await provider?.calculateMetric(mockEntity);

      expect(result).toBe(false);
    });

    it('should handle bare repo source locations without branch ref', async () => {
      const { getEntitySourceLocation } = jest.requireMock(
        '@backstage/catalog-model',
      );
      getEntitySourceLocation.mockReturnValueOnce({
        type: 'url',
        target: 'https://github.com/org/my-repo',
      });

      const existingFiles = new Set(['README.md']);
      const mockUrlReader = createMockUrlReader(existingFiles);

      const config = new ConfigReader({
        scorecard: {
          plugins: {
            filecheck: {
              files: [{ readme: 'README.md' }],
            },
          },
        },
      });
      const provider = createFilecheckMetricProvider(config, mockUrlReader);

      const result = await provider?.calculateMetrics(mockEntity);

      expect(result?.get('filecheck.readme')).toBe(true);
      expect(mockUrlReader.readTree).toHaveBeenCalledWith(
        'https://github.com/org/my-repo',
        expect.objectContaining({ filter: expect.any(Function) }),
      );
    });

    it('should use ETag cache to skip re-downloading unchanged trees', async () => {
      const existingFiles = new Set(['README.md']);
      const mockUrlReader = createMockUrlReader(existingFiles);

      const config = new ConfigReader({
        scorecard: {
          plugins: {
            filecheck: {
              files: [{ readme: 'README.md' }],
            },
          },
        },
      });
      const provider = createFilecheckMetricProvider(config, mockUrlReader);

      await provider?.calculateMetrics(mockEntity);

      const notModifiedError = new Error('Not modified');
      notModifiedError.name = 'NotModifiedError';
      (mockUrlReader.readTree as jest.Mock).mockRejectedValueOnce(
        notModifiedError,
      );

      const result = await provider?.calculateMetrics(mockEntity);

      expect(result?.get('filecheck.readme')).toBe(true);
      expect(mockUrlReader.readTree).toHaveBeenCalledTimes(2);
      expect(mockUrlReader.readTree).toHaveBeenNthCalledWith(
        2,
        'https://github.com/org/my-repo/tree/main/',
        expect.objectContaining({ etag: 'test-etag' }),
      );
    });
  });
});

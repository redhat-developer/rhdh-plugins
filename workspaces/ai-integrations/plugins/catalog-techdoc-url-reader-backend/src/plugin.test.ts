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
import { NotFoundError, NotModifiedError } from '@backstage/errors';
import { mockServices } from '@backstage/backend-test-utils';
import { ReadUrlResponseFactory } from '@backstage/backend-defaults/urlReader';
import {
  ModeCatalogBridgeTechdocUrlReader,
  ModelCatalogBridgeUrlReaderServiceReadTreeResponse,
  readBridgeConfigs,
  readSkillSourceConfigs,
} from './plugin';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { Readable } from 'stream';

const mockNodeFetch = jest.fn();
jest.mock('node-fetch', () => ({
  __esModule: true,
  default: (url: string, options: any) => mockNodeFetch(url, options),
}));

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    mkdtemp: jest.fn(),
    writeFile: jest.fn(),
  },
  mkdirSync: jest.fn(),
  copyFileSync: jest.fn(),
}));

describe('readModelCatalogApiEntityConfigs', () => {
  it('should return empty array if no provider config', () => {
    const config = new ConfigReader({});
    const result = readBridgeConfigs(config);
    expect(result).toEqual([]);
  });

  it('should read cluster-nested provider configs', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          modelCatalog: {
            'kserve-kubeflow-connector': {
              'cluster-1': {
                name: 'my-k8s-cluster',
                'kubeflow-model-catalog-url': 'https://provider1.com:8080',
                'default-owner': 'team-alpha',
                'default-lifecycle': 'production',
              },
              'cluster-2': {
                name: 'another-cluster',
                'kubeflow-model-catalog-url': 'https://provider2.com:9000',
                'default-owner': 'team-beta',
                'default-lifecycle': 'staging',
              },
            },
          },
        },
      },
    });
    const result = readBridgeConfigs(config);
    expect(result).toEqual([
      {
        id: 'kserve-kubeflow-connector',
        name: 'my-k8s-cluster',
        kubeflowModelCatalogUrl: 'https://provider1.com:8080',
        defaultOwner: 'team-alpha',
        defaultLifecycle: 'production',
      },
      {
        id: 'kserve-kubeflow-connector',
        name: 'another-cluster',
        kubeflowModelCatalogUrl: 'https://provider2.com:9000',
        defaultOwner: 'team-beta',
        defaultLifecycle: 'staging',
      },
    ]);
  });

  it('should skip non-cluster keys like schedule', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          modelCatalog: {
            'kserve-kubeflow-connector': {
              schedule: {
                frequency: { minutes: 30 },
                timeout: { minutes: 3 },
              },
              'cluster-1': {
                name: 'my-cluster',
                'kubeflow-model-catalog-url': 'https://example.com',
                'default-owner': 'owner',
                'default-lifecycle': 'production',
              },
            },
          },
        },
      },
    });
    const result = readBridgeConfigs(config);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('my-cluster');
  });
});

describe('ModeCatalogBridgeTechdocUrlReader', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  const newReader = (config: any) => {
    return new ModeCatalogBridgeTechdocUrlReader(
      new ConfigReader(config),
      mockServices.logger.mock(),
    );
  };

  describe('constructor', () => {
    it('should read bridge configs', () => {
      const reader = newReader({
        catalog: {
          providers: {
            modelCatalog: {
              test: {
                'cluster-1': {
                  name: 'my-cluster',
                  'kubeflow-model-catalog-url': 'https://test.com:8080',
                  'default-owner': 'owner',
                  'default-lifecycle': 'production',
                },
              },
            },
          },
        },
      });
      // @ts-ignore
      expect(reader.bridgeConfigs).toHaveLength(1);
      // @ts-ignore
      expect(reader.bridgeConfigs[0].kubeflowModelCatalogUrl).toBe(
        'https://test.com:8080',
      );
    });

    it('should use backend workingDirectory from config', () => {
      const tmp = require('tmp');
      const tmpobj = tmp.fileSync();
      const reader = newReader({ backend: { workingDirectory: tmpobj.name } });
      // @ts-ignore
      expect(reader.workDir).toBe(tmpobj.name);
    });
  });

  describe('factory', () => {
    it('should create a reader and a predicate', () => {
      const factory = ModeCatalogBridgeTechdocUrlReader.factory;
      const result = factory({
        config: new ConfigReader({}),
        logger: mockServices.logger.mock(),
        treeResponseFactory: {} as any,
      });
      expect(result).toHaveLength(1);
      expect(result[0].reader).toBeInstanceOf(
        ModeCatalogBridgeTechdocUrlReader,
      );
      expect(result[0].predicate).toBeInstanceOf(Function);
    });
  });

  describe('bridgePredicate', () => {
    it('should match URL containing connector ID and modelcard', () => {
      const reader = newReader({
        catalog: {
          providers: {
            modelCatalog: {
              test: {
                'cluster-1': {
                  name: 'my-cluster',
                  'kubeflow-model-catalog-url': 'https://example.com',
                  'default-owner': 'owner',
                  'default-lifecycle': 'production',
                },
              },
            },
          },
        },
      });
      expect(
        reader.bridgePredicate(
          new URL('https://localhost:9090/modelcard/test'),
        ),
      ).toBe(true);
    });

    it('should match configured bridge URL', () => {
      const reader = newReader({
        catalog: {
          providers: {
            modelCatalog: {
              test: {
                'cluster-1': {
                  name: 'my-cluster',
                  'kubeflow-model-catalog-url': 'https://test.com:8080',
                  'default-owner': 'owner',
                  'default-lifecycle': 'production',
                },
              },
            },
          },
        },
      });
      expect(
        reader.bridgePredicate(new URL('https://test.com:8080/modelcard/test')),
      ).toBe(true);
    });

    it('should not match incorrect URL', () => {
      const reader = newReader({});
      expect(
        reader.bridgePredicate(new URL('https://other.com:9090/modelcard')),
      ).toBe(false);
    });
  });

  describe('readTree', () => {
    it('should return a ModelCatalogBridgeUrlReaderServiceReadTreeResponse', async () => {
      const reader = newReader({});
      const buffer = Buffer.from('content');
      const etag = 'my-etag';

      jest.spyOn(reader, 'readUrl').mockResolvedValue({
        buffer: async () => buffer,
        etag,
        lastModifiedAt: new Date(),
        stream: () => new Readable(),
      });

      const response = await reader.readTree(
        'https://localhost:9090/modelcard',
        { etag },
      );
      expect(response).toBeInstanceOf(
        ModelCatalogBridgeUrlReaderServiceReadTreeResponse,
      );
      // @ts-ignore
      expect(response.etag).toBe(etag);
    });
  });

  describe('readUrl', () => {
    const readerConfig = {
      catalog: {
        providers: {
          modelCatalog: {
            'kserve-kubeflow-connector': {
              'cluster-1': {
                name: 'my-cluster',
                'kubeflow-model-catalog-url': 'https://example.com',
                'default-owner': 'owner',
                'default-lifecycle': 'production',
              },
            },
          },
        },
      },
    };

    const testUrl =
      'http://localhost:7007/api/kserve-kubeflow-connector/modelcard/source1/modelA';

    beforeEach(() => {
      ModeCatalogBridgeTechdocUrlReader.auth = {
        getPluginRequestToken: jest
          .fn()
          .mockResolvedValue({ token: 'test-token' }),
        getOwnServiceCredentials: jest.fn().mockResolvedValue({}),
      } as any;
    });

    it('should return a response on success', async () => {
      const reader = newReader(readerConfig);
      const mockResponse = { ok: true, status: 200 };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);
      jest.spyOn(ReadUrlResponseFactory, 'fromResponse').mockResolvedValue({
        buffer: async () => Buffer.from('markdown content'),
        etag: 'test-etag',
      } as any);

      const result = await reader.readUrl(testUrl);
      expect(result).toBeDefined();
      expect(result.etag).toBe('test-etag');
      expect(global.fetch).toHaveBeenCalledWith(
        testUrl,
        expect.objectContaining({
          method: 'GET',
          redirect: 'error',
          headers: { Authorization: 'Bearer test-token' },
        }),
      );
    });

    it('should throw Error when no matching bridge config', async () => {
      const reader = newReader(readerConfig);
      await expect(
        reader.readUrl('http://localhost:7007/api/unknown-plugin/something'),
      ).rejects.toThrow('No matching config');
    });

    it('should throw NotFoundError on 404', async () => {
      const reader = newReader(readerConfig);
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(reader.readUrl(testUrl)).rejects.toThrow(NotFoundError);
    });

    it('should throw NotModifiedError on 304', async () => {
      const reader = newReader(readerConfig);
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 304,
        statusText: 'Not Modified',
      });

      await expect(reader.readUrl(testUrl)).rejects.toThrow(NotModifiedError);
    });

    it('should throw Error on other non-ok status', async () => {
      const reader = newReader(readerConfig);
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(reader.readUrl(testUrl)).rejects.toThrow('could not read');
    });

    it('should throw Error when fetch rejects', async () => {
      const reader = newReader(readerConfig);
      global.fetch = jest.fn().mockRejectedValue(new Error('network failure'));

      await expect(reader.readUrl(testUrl)).rejects.toThrow('Unable to read');
    });
  });

  describe('search', () => {
    it('should throw', async () => {
      const reader = newReader({});
      await expect(reader.search('some-url')).rejects.toThrow(
        'ModeCatalogBridgeTechdocUrlReader does not implement search',
      );
    });
  });
});

describe('ModelCatalogBridgeUrlReaderServiceReadTreeResponse', () => {
  const workDir = os.tmpdir();
  const etag = 'test-etag';
  const buffer = Promise.resolve(Buffer.from('markdown content'));

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('files() should throw', async () => {
    const response = new ModelCatalogBridgeUrlReaderServiceReadTreeResponse(
      workDir,
      etag,
      buffer,
      mockServices.logger.mock(),
    );
    await expect(response.files()).rejects.toThrow(
      'ModelCatalogBridgeUrlReaderServiceReadTreeResponse does not implement files',
    );
  });

  it('archive() should throw', async () => {
    const response = new ModelCatalogBridgeUrlReaderServiceReadTreeResponse(
      workDir,
      etag,
      buffer,
      mockServices.logger.mock(),
    );
    await expect(response.archive()).rejects.toThrow(
      'ModelCatalogBridgeUrlReaderServiceReadTreeResponse does not implement archive',
    );
  });

  describe('dir', () => {
    it('should create temp dir, write mkdocs.yml and docs files', async () => {
      const tmp = require('tmp');
      const tmpobj = tmp.fileSync();
      (fs.promises.mkdtemp as jest.Mock).mockResolvedValue(tmpobj.name);

      const response = new ModelCatalogBridgeUrlReaderServiceReadTreeResponse(
        workDir,
        etag,
        buffer,
        mockServices.logger.mock(),
      );

      const resultDir = await response.dir();

      expect(fs.promises.mkdtemp).toHaveBeenCalledWith(
        path.join(workDir, 'backstage-'),
      );
      // mkdocs.yml should be written at the root
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        path.join(tmpobj.name, 'mkdocs.yml'),
        "site_name: 'Model Card'\nnav:\n  - Home: index.md\n",
      );
      // docs/index.md should be written
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        path.join(tmpobj.name, 'docs', 'index.md'),
        await buffer,
      );
      expect(fs.mkdirSync).toHaveBeenCalledWith(path.join(tmpobj.name, 'docs'));
      expect(resultDir).toBe(tmpobj.name);
    });

    it('should use targetDir if provided', async () => {
      const targetDir = '/custom/dir';
      const response = new ModelCatalogBridgeUrlReaderServiceReadTreeResponse(
        workDir,
        etag,
        buffer,
        mockServices.logger.mock(),
      );

      const resultDir = await response.dir({ targetDir });

      expect(fs.promises.mkdtemp).not.toHaveBeenCalled();
      // mkdocs.yml at targetDir root
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        path.join(targetDir, 'mkdocs.yml'),
        "site_name: 'Model Card'\nnav:\n  - Home: index.md\n",
      );
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        path.join(targetDir, 'docs', 'index.md'),
        await buffer,
      );
      expect(fs.mkdirSync).toHaveBeenCalledWith(path.join(targetDir, 'docs'));
      expect(resultDir).toBe(targetDir);
    });

    it('should use custom siteName when provided', async () => {
      const targetDir = '/custom/dir';
      const response = new ModelCatalogBridgeUrlReaderServiceReadTreeResponse(
        workDir,
        etag,
        buffer,
        mockServices.logger.mock(),
        'Skill Documentation',
      );

      await response.dir({ targetDir });

      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        path.join(targetDir, 'mkdocs.yml'),
        "site_name: 'Skill Documentation'\nnav:\n  - Home: index.md\n",
      );
    });
  });
});

// ─── OCI skill TechDocs source configuration tests ──────────────────

const validDigest =
  'sha256:abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';

const skillConfig = {
  catalog: {
    providers: {
      skillsCatalogProvider: {
        production: {
          sources: [
            {
              connectorPluginId: 'skill-image-connector',
              sourceId: 'quay-public',
              sourceType: 'oci',
            },
          ],
          defaultOwner: 'team-skills',
          defaultLifecycle: 'production',
        },
      },
    },
  },
};

const newSkillReader = (config: any) => {
  return new ModeCatalogBridgeTechdocUrlReader(
    new ConfigReader(config),
    mockServices.logger.mock(),
    new Map([
      [
        'skill-image-connector',
        'http://localhost:7007/api/skill-image-connector',
      ],
    ]),
  );
};

describe('readSkillSourceConfigs', () => {
  it('should return empty array if no provider config', () => {
    const config = new ConfigReader({});
    const result = readSkillSourceConfigs(config);
    expect(result).toEqual([]);
  });

  it('should read OCI sources from skillsCatalogProvider config', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          skillsCatalogProvider: {
            production: {
              sources: [
                {
                  connectorPluginId: 'skill-image-connector',
                  sourceId: 'quay-public',
                  sourceType: 'oci',
                },
              ],
              defaultOwner: 'team-skills',
              defaultLifecycle: 'production',
            },
          },
        },
      },
    });
    const result = readSkillSourceConfigs(config);
    expect(result).toEqual([
      {
        connectorPluginId: 'skill-image-connector',
        sourceId: 'quay-public',
      },
    ]);
  });

  it('should skip npx sources', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          skillsCatalogProvider: {
            production: {
              sources: [
                {
                  connectorPluginId: 'skill-image-connector',
                  sourceId: 'quay-public',
                  sourceType: 'oci',
                },
                {
                  connectorPluginId: 'npx-skill-connector',
                  sourceId: 'rhess-index',
                  sourceType: 'npx',
                },
              ],
              defaultOwner: 'team-skills',
              defaultLifecycle: 'production',
            },
          },
        },
      },
    });
    const result = readSkillSourceConfigs(config);
    expect(result).toHaveLength(1);
    expect(result[0].sourceId).toBe('quay-public');
  });

  it('should skip blank source IDs', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          skillsCatalogProvider: {
            production: {
              sources: [
                {
                  connectorPluginId: 'skill-image-connector',
                  sourceId: '',
                  sourceType: 'oci',
                },
              ],
              defaultOwner: 'team-skills',
              defaultLifecycle: 'production',
            },
          },
        },
      },
    });
    const result = readSkillSourceConfigs(config);
    expect(result).toEqual([]);
  });

  it('should skip dot source IDs', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          skillsCatalogProvider: {
            production: {
              sources: [
                {
                  connectorPluginId: 'skill-image-connector',
                  sourceId: '.',
                  sourceType: 'oci',
                },
                {
                  connectorPluginId: 'skill-image-connector',
                  sourceId: '..',
                  sourceType: 'oci',
                },
              ],
              defaultOwner: 'team-skills',
              defaultLifecycle: 'production',
            },
          },
        },
      },
    });
    const result = readSkillSourceConfigs(config);
    expect(result).toEqual([]);
  });

  it('should deduplicate across provider instances', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          skillsCatalogProvider: {
            production: {
              sources: [
                {
                  connectorPluginId: 'skill-image-connector',
                  sourceId: 'quay-public',
                  sourceType: 'oci',
                },
              ],
              defaultOwner: 'team-skills',
              defaultLifecycle: 'production',
            },
            staging: {
              sources: [
                {
                  connectorPluginId: 'skill-image-connector',
                  sourceId: 'quay-public',
                  sourceType: 'oci',
                },
              ],
              defaultOwner: 'team-skills',
              defaultLifecycle: 'staging',
            },
          },
        },
      },
    });
    const result = readSkillSourceConfigs(config);
    expect(result).toHaveLength(1);
  });
});

describe('Skill docs URL matching', () => {
  it('should match skill docs URL with correct pattern', () => {
    const reader = newSkillReader(skillConfig);
    const url = new URL(
      `http://localhost:7007/api/skill-image-connector/skilldocs/quay-public/${validDigest}`,
    );
    expect(reader.bridgePredicate(url)).toBe(true);
  });

  it('should not match root-level /skilldocs/ without /api/<pluginId>', () => {
    const reader = newSkillReader(skillConfig);
    const url = new URL(
      `http://localhost:7007/skilldocs/quay-public/${validDigest}`,
    );
    expect(reader.bridgePredicate(url)).toBe(false);
  });

  it('should not match another plugin path', () => {
    const reader = newSkillReader(skillConfig);
    const url = new URL(
      `http://localhost:7007/api/other-plugin/skilldocs/quay-public/${validDigest}`,
    );
    expect(reader.bridgePredicate(url)).toBe(false);
  });

  it('should not match untrusted source ID', () => {
    const reader = newSkillReader(skillConfig);
    const url = new URL(
      `http://localhost:7007/api/skill-image-connector/skilldocs/unknown-source/${validDigest}`,
    );
    expect(reader.bridgePredicate(url)).toBe(false);
  });

  it('should not match invalid digest format', () => {
    const reader = newSkillReader(skillConfig);
    const url = new URL(
      'http://localhost:7007/api/skill-image-connector/skilldocs/quay-public/sha256:tooshort',
    );
    expect(reader.bridgePredicate(url)).toBe(false);
  });

  it('should not match URL with query string', () => {
    const reader = newSkillReader(skillConfig);
    const url = new URL(
      `http://localhost:7007/api/skill-image-connector/skilldocs/quay-public/${validDigest}?foo=bar`,
    );
    expect(reader.bridgePredicate(url)).toBe(false);
  });

  it('should not match URL with fragment', () => {
    const reader = newSkillReader(skillConfig);
    const url = new URL(
      `http://localhost:7007/api/skill-image-connector/skilldocs/quay-public/${validDigest}#section`,
    );
    expect(reader.bridgePredicate(url)).toBe(false);
  });

  it('should not match URL with credentials', () => {
    const reader = newSkillReader(skillConfig);
    const url = new URL(
      `http://user:pass@localhost:7007/api/skill-image-connector/skilldocs/quay-public/${validDigest}`,
    );
    expect(reader.bridgePredicate(url)).toBe(false);
  });

  it('should not match URL with extra path segments', () => {
    const reader = newSkillReader(skillConfig);
    const url = new URL(
      `http://localhost:7007/api/skill-image-connector/skilldocs/quay-public/${validDigest}/extra`,
    );
    expect(reader.bridgePredicate(url)).toBe(false);
  });

  it('should not match URL with trailing slash', () => {
    const reader = newSkillReader(skillConfig);
    const url = new URL(
      `http://localhost:7007/api/skill-image-connector/skilldocs/quay-public/${validDigest}/`,
    );
    expect(reader.bridgePredicate(url)).toBe(false);
  });

  it('should match URL with encoded source ID', () => {
    const encodedConfig = {
      catalog: {
        providers: {
          skillsCatalogProvider: {
            production: {
              sources: [
                {
                  connectorPluginId: 'skill-image-connector',
                  sourceId: 'quay/public',
                  sourceType: 'oci',
                },
              ],
              defaultOwner: 'team-skills',
              defaultLifecycle: 'production',
            },
          },
        },
      },
    };
    const reader = newSkillReader(encodedConfig);
    const url = new URL(
      `http://localhost:7007/api/skill-image-connector/skilldocs/${encodeURIComponent(
        'quay/public',
      )}/${validDigest}`,
    );
    expect(reader.bridgePredicate(url)).toBe(true);
  });

  it('should continue to match model-card URLs', () => {
    const combinedConfig = {
      ...skillConfig,
      catalog: {
        ...skillConfig.catalog,
        providers: {
          ...skillConfig.catalog.providers,
          modelCatalog: {
            test: {
              'cluster-1': {
                name: 'my-cluster',
                'kubeflow-model-catalog-url': 'https://example.com',
                'default-owner': 'owner',
                'default-lifecycle': 'production',
              },
            },
          },
        },
      },
    };
    const reader = newSkillReader(combinedConfig);
    expect(
      reader.bridgePredicate(new URL('https://localhost:9090/modelcard/test')),
    ).toBe(true);
  });

  it('should not match with no skill source config', () => {
    const reader = newSkillReader({});
    const url = new URL(
      `http://localhost:7007/api/skill-image-connector/skilldocs/quay-public/${validDigest}`,
    );
    expect(reader.bridgePredicate(url)).toBe(false);
  });
});

describe('Skill docs readUrl', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  const testUrl = `http://localhost:7007/api/skill-image-connector/skilldocs/quay-public/${validDigest}`;

  beforeEach(() => {
    ModeCatalogBridgeTechdocUrlReader.auth = {
      getPluginRequestToken: jest
        .fn()
        .mockResolvedValue({ token: 'test-token' }),
      getOwnServiceCredentials: jest.fn().mockResolvedValue({}),
    } as any;
  });

  it('should authenticate with the connector plugin ID', async () => {
    const reader = newSkillReader(skillConfig);
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ etag: 'response-etag' }),
    };
    global.fetch = jest.fn().mockResolvedValue(mockResponse);
    jest.spyOn(ReadUrlResponseFactory, 'fromResponse').mockResolvedValue({
      buffer: async () => Buffer.from('# Skill Docs'),
      etag: 'response-etag',
    } as any);

    await reader.readUrl(testUrl);

    expect(
      ModeCatalogBridgeTechdocUrlReader.auth.getPluginRequestToken,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        targetPluginId: 'skill-image-connector',
      }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      testUrl,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
        redirect: 'error',
      }),
    );
  });

  it('should forward If-None-Match header when etag is provided', async () => {
    const reader = newSkillReader(skillConfig);
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ etag: 'response-etag' }),
    };
    global.fetch = jest.fn().mockResolvedValue(mockResponse);
    jest.spyOn(ReadUrlResponseFactory, 'fromResponse').mockResolvedValue({
      buffer: async () => Buffer.from('content'),
      etag: 'response-etag',
    } as any);

    await reader.readUrl(testUrl, { etag: 'cached-etag' });

    expect(global.fetch).toHaveBeenCalledWith(
      testUrl,
      expect.objectContaining({
        cache: 'no-cache',
        headers: expect.objectContaining({
          'If-None-Match': 'cached-etag',
          Authorization: 'Bearer test-token',
        }),
      }),
    );
  });

  it('should not send If-None-Match when no etag provided', async () => {
    const reader = newSkillReader(skillConfig);
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ etag: 'response-etag' }),
    };
    global.fetch = jest.fn().mockResolvedValue(mockResponse);
    jest.spyOn(ReadUrlResponseFactory, 'fromResponse').mockResolvedValue({
      buffer: async () => Buffer.from('content'),
      etag: 'response-etag',
    } as any);

    await reader.readUrl(testUrl);

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    expect(fetchCall[1].headers).not.toHaveProperty('If-None-Match');
  });

  it('should throw NotFoundError on 404', async () => {
    const reader = newSkillReader(skillConfig);
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(reader.readUrl(testUrl)).rejects.toThrow(NotFoundError);
  });

  it('should throw NotModifiedError on 304', async () => {
    const reader = newSkillReader(skillConfig);
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 304,
      statusText: 'Not Modified',
    });

    await expect(reader.readUrl(testUrl)).rejects.toThrow(NotModifiedError);
  });

  it('should propagate server errors', async () => {
    const reader = newSkillReader(skillConfig);
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(reader.readUrl(testUrl)).rejects.toThrow('could not read');
  });

  it('should throw on fetch failure (e.g. redirect rejection)', async () => {
    const reader = newSkillReader(skillConfig);
    global.fetch = jest.fn().mockRejectedValue(new TypeError('redirect error'));

    await expect(reader.readUrl(testUrl)).rejects.toThrow('Unable to read');
  });

  it('should throw when no config matches', async () => {
    const reader = newSkillReader({});
    await expect(reader.readUrl(testUrl)).rejects.toThrow('No matching config');
  });
});

describe('Skill docs readTree', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  const testUrl = `http://localhost:7007/api/skill-image-connector/skilldocs/quay-public/${validDigest}`;

  beforeEach(() => {
    ModeCatalogBridgeTechdocUrlReader.auth = {
      getPluginRequestToken: jest
        .fn()
        .mockResolvedValue({ token: 'test-token' }),
      getOwnServiceCredentials: jest.fn().mockResolvedValue({}),
    } as any;
  });

  it('should return response with ETag from connector response', async () => {
    const reader = newSkillReader(skillConfig);
    const responseBuffer = Buffer.from('# Skill Documentation');

    jest.spyOn(reader, 'readUrl').mockResolvedValue({
      buffer: async () => responseBuffer,
      etag: 'connector-etag',
      lastModifiedAt: new Date(),
      stream: () => new Readable(),
    });

    const response = await reader.readTree(testUrl, {
      etag: 'old-cached-etag',
    });

    expect(response).toBeInstanceOf(
      ModelCatalogBridgeUrlReaderServiceReadTreeResponse,
    );
    // Should use the response ETag, not the request ETag
    // @ts-ignore - accessing private field for testing
    expect(response.etag).toBe('connector-etag');
  });

  it('should use Skill Documentation as site name', async () => {
    const reader = newSkillReader(skillConfig);
    const responseBuffer = Buffer.from('# Skill Documentation');

    jest.spyOn(reader, 'readUrl').mockResolvedValue({
      buffer: async () => responseBuffer,
      etag: 'etag',
      lastModifiedAt: new Date(),
      stream: () => new Readable(),
    });

    const response = await reader.readTree(testUrl);
    const targetDir = '/test-dir';
    await response.dir({ targetDir });

    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      path.join(targetDir, 'mkdocs.yml'),
      "site_name: 'Skill Documentation'\nnav:\n  - Home: index.md\n",
    );
    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      path.join(targetDir, 'docs', 'index.md'),
      responseBuffer,
    );
  });

  it('should preserve model-card readTree behavior', async () => {
    const modelCardConfig = {
      catalog: {
        providers: {
          modelCatalog: {
            'kserve-kubeflow-connector': {
              'cluster-1': {
                name: 'my-cluster',
                'kubeflow-model-catalog-url': 'https://example.com',
                'default-owner': 'owner',
                'default-lifecycle': 'production',
              },
            },
          },
        },
      },
    };
    const reader = newSkillReader(modelCardConfig);
    const responseBuffer = Buffer.from('model card content');

    jest.spyOn(reader, 'readUrl').mockResolvedValue({
      buffer: async () => responseBuffer,
      etag: 'response-etag',
      lastModifiedAt: new Date(),
      stream: () => new Readable(),
    });

    const modelCardUrl =
      'http://localhost:7007/api/kserve-kubeflow-connector/modelcard/source1/modelA';

    const response = await reader.readTree(modelCardUrl, {
      etag: 'request-etag',
    });

    // Model-card readTree uses the request etag, not response etag
    // @ts-ignore
    expect(response.etag).toBe('request-etag');

    const targetDir = '/test-dir';
    await response.dir({ targetDir });
    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      path.join(targetDir, 'mkdocs.yml'),
      "site_name: 'Model Card'\nnav:\n  - Home: index.md\n",
    );
  });
});

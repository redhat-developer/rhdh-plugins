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
import { NotFoundError } from '@backstage/errors';
import { mockServices } from '@backstage/backend-test-utils';
import {
  ModeCatalogBridgeTechdocUrlReader,
  ModelCatalogBridgeUrlReaderServiceReadTreeResponse,
  readModelCatalogApiEntityConfigs,
} from './plugin';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { Readable } from 'stream';

const fetch = jest.fn();
jest.mock('node-fetch', () => ({
  __esModule: true,
  default: (url: string, options: any) => fetch(url, options),
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
    const result = readModelCatalogApiEntityConfigs(config);
    expect(result).toEqual([]);
  });

  it('should read multiple provider configs', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          modelCatalog: {
            provider1: {
              baseUrl: 'https://provider1.com:8080',
            },
            provider2: {
              baseUrl: 'https://provider2.com:9000',
            },
          },
        },
      },
    });
    const result = readModelCatalogApiEntityConfigs(config);
    expect(result).toEqual([
      {
        id: 'provider1',
        baseUrl: 'https://provider1.com:8080',
        schedule: undefined,
      },
      {
        id: 'provider2',
        baseUrl: 'https://provider2.com:9000',
        schedule: undefined,
      },
    ]);
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
                baseUrl: 'https://test.com:8080',
              },
            },
          },
        },
      });
      // @ts-ignore
      expect(reader.bridgeConfigs).toHaveLength(1);
      // @ts-ignore
      expect(reader.bridgeConfigs[0].baseUrl).toBe('https://test.com:8080');
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
    it('should match default localhost URL', () => {
      const reader = newReader({});
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
                baseUrl: 'https://test.com:8080',
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

  // describe('readUrl', () => {
  //   it('should read a URL successfully', async () => {
  //     const reader = newReader({});
  //     const mockResponse = {
  //       ok: true,
  //       buffer: async () => Buffer.from('content'),
  //       headers: new Map(),
  //     };
  //     fetch.mockResolvedValue(mockResponse);

  //     const response = await reader.readUrl('http://localhost:9090/modelcard');
  //     expect(fetch).toHaveBeenCalledWith('http://localhost:9090/modelcard', {
  //       signal: undefined,
  //     });
  //     const buffer = await response.buffer();
  //     expect(buffer.toString()).toBe('content');
  //   });

  //   it('should throw NotFoundError for 404 responses', async () => {
  //     const reader = newReader({});
  //     const mockResponse = {
  //       ok: false,
  //       status: 404,
  //       statusText: 'Not Found',
  //     };
  //     fetch.mockResolvedValue(mockResponse);

  //     await expect(
  //       reader.readUrl('http://localhost:9090/modelcard'),
  //     ).rejects.toThrow(NotFoundError);
  //   });

  //   it('should throw Error for other non-ok responses', async () => {
  //     const reader = newReader({});
  //     const mockResponse = {
  //       ok: false,
  //       status: 500,
  //       statusText: 'Internal Server Error',
  //     };
  //     fetch.mockResolvedValue(mockResponse);

  //     await expect(
  //       reader.readUrl('http://localhost:9090/modelcard'),
  //     ).rejects.toThrow(
  //       'could not read http://localhost:9090/modelcard, 500 Internal Server Error',
  //     );
  //   });

  //   it('should throw Error on fetch error', async () => {
  //     const reader = newReader({});
  //     fetch.mockRejectedValue(new Error('network error'));

  //     await expect(
  //       reader.readUrl('http://localhost:9090/modelcard'),
  //     ).rejects.toThrow(
  //       'Unable to read http://localhost:9090/modelcard, Error: network error',
  //     );
  //   });
  // });

  describe('search', () => {
    it('should return files for a successful search', async () => {
      const reader = newReader({});
      const buffer = Buffer.from('content');
      const lastModifiedAt = new Date();
      const etag = 'my-etag';

      jest.spyOn(reader, 'readUrl').mockResolvedValue({
        buffer: async () => buffer,
        etag,
        lastModifiedAt,
        stream: () => new Readable(),
      });

      const result = await reader.search('https://localhost:9090/modelcard');
      expect(result.files).toHaveLength(1);
      expect(result.files[0].url).toBe('https://localhost:9090/modelcard');
      expect((await result.files[0].content()).toString()).toBe('content');
      expect(result.files[0].lastModifiedAt).toBe(lastModifiedAt);
      expect(result.etag).toBe(etag);
    });

    it('should return empty files for a NotFoundError', async () => {
      const reader = newReader({});
      jest
        .spyOn(reader, 'readUrl')
        .mockRejectedValue(new NotFoundError('not found'));

      const result = await reader.search('https://localhost:9090/modelcard');
      expect(result.files).toHaveLength(0);
      expect(result.etag).toBe('');
    });

    it('should re-throw other errors', async () => {
      const reader = newReader({});
      jest.spyOn(reader, 'readUrl').mockRejectedValue(new Error('some error'));

      await expect(
        reader.search('https://localhost:9090/modelcard'),
      ).rejects.toThrow('some error');
    });

    it('should throw for unsupported search patterns', async () => {
      const reader = newReader({});
      await expect(
        reader.search('https://localhost:9090/modelcard*'),
      ).rejects.toThrow('Unsupported search pattern URL');
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
    it('should create temp dir and write files', async () => {
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
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        path.join(tmpobj.name, 'index.md'),
        await buffer,
      );
      expect(fs.mkdirSync).toHaveBeenCalledWith(path.join(tmpobj.name, 'docs'));
      expect(fs.copyFileSync).toHaveBeenCalledWith(
        path.join(tmpobj.name, 'index.md'),
        path.join(tmpobj.name, 'docs', 'index.md'),
      );
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
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        path.join(targetDir, 'index.md'),
        await buffer,
      );
      expect(fs.mkdirSync).toHaveBeenCalledWith(path.join(targetDir, 'docs'));
      expect(fs.copyFileSync).toHaveBeenCalledWith(
        path.join(targetDir, 'index.md'),
        path.join(targetDir, 'docs', 'index.md'),
      );
      expect(resultDir).toBe(targetDir);
    });
  });
});

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

import {
  ReaderFactory,
  ReadUrlResponseFactory,
  urlReaderFactoriesServiceRef,
} from '@backstage/backend-defaults/urlReader';
import {
  coreServices,
  createServiceFactory,
  UrlReaderService,
  UrlReaderServiceReadUrlOptions,
  UrlReaderServiceSearchOptions,
  UrlReaderServiceSearchResponse,
  UrlReaderServiceReadUrlResponse,
  UrlReaderServiceReadTreeOptions,
  UrlReaderServiceReadTreeResponse,
  UrlReaderServiceReadTreeResponseFile,
  UrlReaderServiceReadTreeResponseDirOptions,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import { NotFoundError, NotModifiedError } from '@backstage/errors';
import { Readable } from 'stream';
import fs from 'fs';
import platformPath from 'path';
import os from 'os';

export class ModelCatalogBridgeUrlReaderServiceReadTreeResponse
  implements UrlReaderServiceReadTreeResponse
{
  constructor(
    private readonly workDir: string,
    public readonly etag: string,
    private readonly buffer: Promise<Buffer>,
    private readonly logger: LoggerService,
  ) {
    this.logger = logger.child({
      source: 'ModelCatalogBridgeUrlReaderServiceReadTreeResponse"',
    });
  }
  async files(): Promise<UrlReaderServiceReadTreeResponseFile[]> {
    throw new Error(
      'ModelCatalogBridgeUrlReaderServiceReadTreeResponse does not implement files',
    );
  }
  async archive(): Promise<Readable> {
    throw new Error(
      'ModelCatalogBridgeUrlReaderServiceReadTreeResponse does not implement archive',
    );
  }

  async dir(
    options?: UrlReaderServiceReadTreeResponseDirOptions,
  ): Promise<string> {
    const dir =
      options?.targetDir ??
      (await fs.promises.mkdtemp(
        platformPath.join(this.workDir, 'backstage-'),
      ));

    const subDir = platformPath.join(dir, 'docs');
    const filePath = platformPath.join(subDir, 'index.md');
    try {
      fs.mkdirSync(subDir);
      const buf = await this.buffer;
      await fs.promises.writeFile(filePath, buf);
    } catch (error) {
      this.logger.error(`Error writing to file ${filePath}:`, error);
    }

    return dir;
  }
}

export type BridgeConfig = {
  id: string;
  baseUrl: string;
};

export function readBridgeConfigs(config: Config): BridgeConfig[] {
  const configs = config.getOptionalConfig('catalog.providers.modelCatalog');
  if (!configs) {
    return [];
  }
  return configs.keys().map(id => readBridgeConfig(id, configs.getConfig(id)));
}

export function readBridgeConfig(id: string, config: Config): BridgeConfig {
  const url = config.getString('baseUrl');
  return { id, baseUrl: url };
}

export class ModeCatalogBridgeTechdocUrlReader implements UrlReaderService {
  private readonly workDir: string;
  private readonly logger: LoggerService;
  private readonly bridgeConfigs: BridgeConfig[];

  static factory: ReaderFactory = ({ config, logger }) => {
    const reader = new ModeCatalogBridgeTechdocUrlReader(config, logger);
    const predicate = (url: URL) => reader.bridgePredicate(url);

    return [{ reader, predicate }];
  };

  constructor(config: Config, logger: LoggerService) {
    this.logger = logger.child({
      source: 'ModeCatalogBridgeTechdocUrlReader"',
    });
    this.bridgeConfigs = readBridgeConfigs(config);
    this.workDir = os.tmpdir();

    const bkend = config.getOptionalString('backend.workingDirectory');
    if (bkend) {
      this.workDir = bkend;
    }
  }

  bridgePredicate = (url: URL): boolean => {
    for (let index = 0; index < this.bridgeConfigs.length; index++) {
      const bc = this.bridgeConfigs[index];
      const bcUrl = new URL(bc.baseUrl);
      if (
        url.hostname === bcUrl.hostname &&
        url.port === bcUrl.port &&
        url.pathname.startsWith('/modelcard')
      ) {
        return true;
      }
    }
    if (
      url.hostname === 'localhost' &&
      url.port === '9090' &&
      url.pathname.startsWith('/modelcard')
    ) {
      return true;
    }
    return false;
  };

  async readUrl(
    url: string,
    options?: UrlReaderServiceReadUrlOptions,
  ): Promise<UrlReaderServiceReadUrlResponse> {
    this.logger.info(`ModelCatalogBridgeTechdocUrlReader.readUrl of ${url}`);
    let response: Response;
    try {
      response = await fetch(url, {
        signal: options?.signal as any,
      });
    } catch (e) {
      throw new Error(`Unable to read ${url}, ${e}`);
    }

    if (response.ok) {
      return ReadUrlResponseFactory.fromResponse(response);
    }

    const message = `could not read ${url}, ${response.status} ${response.statusText}`;
    if (response.status === 404) {
      throw new NotFoundError(message);
    }
    if (response.status === 304) {
      throw new NotModifiedError();
    }
    throw new Error(message);
  }

  async search(
    url: string,
    options?: UrlReaderServiceSearchOptions,
  ): Promise<UrlReaderServiceSearchResponse> {
    this.logger.info(
      `ModelCatalogBridgeTechdocUrlReader.search of ${url} with options ${JSON.stringify(
        options,
      )}`,
    );

    throw new Error(
      'ModeCatalogBridgeTechdocUrlReader does not implement search',
    );
    // const { pathname } = new URL(url);

    // if (pathname.match(/[*?]/)) {
    //   throw new Error('Unsupported search pattern URL');
    // }

    // try {
    //   const data = await this.readUrl(url, options);

    //   return {
    //     files: [
    //       {
    //         url: url,
    //         content: data.buffer,
    //         lastModifiedAt: data.lastModifiedAt,
    //       },
    //     ],
    //     etag: data.etag ?? '',
    //   };
    // } catch (error) {
    //   assertError(error);
    //   if (error.name === 'NotFoundError') {
    //     return {
    //       files: [],
    //       etag: '',
    //     };
    //   }
    //   throw error;
    // }
  }

  async readTree(
    url: string,
    options?: UrlReaderServiceReadTreeOptions,
  ): Promise<UrlReaderServiceReadTreeResponse> {
    this.logger.info(`ModelCatalogBridgeTechdocUrlReader.readTree of ${url}`);
    const data = await this.readUrl(url, options);

    const et = options?.etag;
    if (!et) {
      return await new ModelCatalogBridgeUrlReaderServiceReadTreeResponse(
        this.workDir,
        '',
        data.buffer(),
        this.logger,
      );
    }
    return await new ModelCatalogBridgeUrlReaderServiceReadTreeResponse(
      this.workDir,
      et,
      data.buffer(),
      this.logger,
    );
  }
}

/**
 * catalogTechdocUrlReaderPlugin define the factory for the ModelCatalogBridgeUrlReader service
 *
 * @public
 */
export const catalogTechdocUrlReaderPlugin = createServiceFactory({
  service: urlReaderFactoriesServiceRef,
  deps: {
    logger: coreServices.logger,
  },
  async factory({ logger }) {
    logger
      .child({ source: 'catalogTechdocUrlReaderPlugin"' })
      .info('Registering the model catalog bridge URL reader ');

    return ModeCatalogBridgeTechdocUrlReader.factory;
  },
});

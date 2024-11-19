/*
 * Copyright 2024 The Backstage Authors
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
  AuthService,
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';

import { readFile } from 'node:fs/promises';
import { glob } from 'glob';
import { parse } from 'yaml';

import { MarketplacePluginEntry } from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import { MarketplaceService } from './MarketplaceService';

export type Options = {
  logger: LoggerService;
  auth: AuthService;
  config: RootConfigService;
};

export class MarketplaceServiceFSImpl implements MarketplaceService {
  private readonly logger: LoggerService;
  // TODO: add private
  readonly auth: AuthService;
  readonly config: RootConfigService;

  constructor(options: Options) {
    this.logger = options.logger;
    this.auth = options.auth;
    this.config = options.config;
  }

  async getPlugins(): Promise<MarketplacePluginEntry[]> {
    this.logger.info('getPlugins');

    const entries: MarketplacePluginEntry[] = [];

    const metadataFiles = await glob('../../data/entries/**/metadata.yaml');

    for await (const metadataFile of metadataFiles) {
      this.logger.info('getPlugins, read file', { metadataFile });
      entries.push(await parse(await readFile(metadataFile, 'utf-8')));
    }

    entries.sort((a, b) => a.metadata.title.localeCompare(b.metadata.title));

    return entries;
  }
}

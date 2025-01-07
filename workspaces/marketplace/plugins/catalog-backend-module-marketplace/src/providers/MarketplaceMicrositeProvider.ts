/*
 * Copyright 2025 The Backstage Authors
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
import { LoggerService } from '@backstage/backend-plugin-api';
import {
  ANNOTATION_LOCATION,
  ANNOTATION_ORIGIN_LOCATION,
} from '@backstage/catalog-model';
import { Config } from '@backstage/config';
import {
  DeferredEntity,
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';

import { MarketplacePluginEntry } from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';

interface Microsite {
  title: string;
  author: string;
  authorUrl: string;
  category: string;
  description: string;
  documentation: string;
  iconUrl: string;
  npmPackageName: string;
  addedDate: string;
}

interface Options {
  logger: LoggerService;
}

export class MarketplaceMicrositeProvider implements EntityProvider {
  static fromConfig(
    config: Config,
    options: Options,
  ): MarketplaceMicrositeProvider[] {
    // const configs = config.getOptionalConfigArray('marketplace.providers.npm');
    // if (!configs) {
    //   return [];
    // }
    return [new MarketplaceMicrositeProvider(options)];
  }

  constructor(private readonly options: Options) {
    this.options = options;
  }

  getProviderName(): string {
    return `MarketplaceMicrositeProvider:{this.config.id}`;
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    const folder =
      '/home/christoph/git/backstage/backstage/microsite/data/plugins';
    this.options.logger.info('MarketplaceMicrositeProvider connect', {
      folder,
    });

    const entities: DeferredEntity[] = [];

    const files = await fs.readdir(folder);

    for (const file of files) {
      this.options.logger.info('MarketplaceMicrositeProvider connect', {
        file,
      });

      const micrositeString = await fs.readFile(
        path.join(folder, file),
        'utf8',
      );
      const micrositeData = yaml.parse(micrositeString) as Microsite;

      const plugin: MarketplacePluginEntry = {
        apiVersion: 'marketplace.backstage.io/v1alpha1',
        kind: 'Plugin',
        metadata: {
          name: `microsite-${file}`,
          title: micrositeData.title,
          description: micrositeData.description,
          annotations: {
            [ANNOTATION_LOCATION]: `microsite:${path.join(folder, file)}`,
            [ANNOTATION_ORIGIN_LOCATION]: `microsite:${path.join(
              folder,
              file,
            )}`,
          },
          links: [
            {
              url: micrositeData.authorUrl,
              title: micrositeData.author,
            },
            {
              url: `https://npmjs.com/package/${micrositeData.npmPackageName}`,
              title: `Npm package ${micrositeData.npmPackageName}`,
            },
            {
              url: micrositeData.documentation,
              title: 'Documentation',
              type: 'docs',
            },
          ],
        },
        spec: {
          type: 'frontend-plugin',
          lifecycle: 'unknown',
          owner: micrositeData.author,

          icon: micrositeData.iconUrl?.startsWith('/')
            ? `https://backstage.io${micrositeData.iconUrl}`
            : micrositeData.iconUrl,
          categories: micrositeData.category ? [micrositeData.category] : [],
          developer: micrositeData.author,

          description: micrositeData.description,
          installation: {
            markdown: `# Installation

\`\`\`
yarn install ${micrositeData.npmPackageName}
\`\`\`
`,
          },
        },
      };

      entities.push({
        entity: plugin,
      });
    }

    connection.applyMutation({
      type: 'full',
      entities,
    });
  }
}

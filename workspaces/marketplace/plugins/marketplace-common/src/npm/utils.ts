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
import { EntityLink } from '@backstage/catalog-model/index';

import { MarketplacePluginEntry } from '../types';
import { fetchNpmPackage } from './api';

export async function extractPlugin(
  packageName: string,
): Promise<MarketplacePluginEntry> {
  // eslint-disable-next-line no-console
  console.log('Extracting from NPM package', packageName);

  const packageInfo = await fetchNpmPackage(packageName);
  const latestVersion = packageInfo['dist-tags'].latest;
  const versionInfo = packageInfo.versions[latestVersion];

  // eslint-disable-next-line no-console
  console.log('Found version', latestVersion);
  // eslint-disable-next-line no-console
  console.log();

  const backstageInfo = (versionInfo as any).backstage;
  // console.log(backstageInfo);
  // console.log();

  let author: string | undefined = undefined;
  if (typeof packageInfo.author === 'string') author = packageInfo.author;
  if (typeof packageInfo.author === 'object') author = packageInfo.author.name;

  const keywords = (versionInfo as any).keywords ?? [];
  // console.log(keywords);
  // console.log();

  const links: EntityLink[] = [];
  if (typeof packageInfo.homepage === 'string') {
    links.push({
      url: packageInfo.homepage,
      title: 'Homepage',
    });
  }
  if (typeof packageInfo.bugs === 'string') {
    links.push({
      url: packageInfo.bugs,
      title: 'Bugs',
      type: 'bug-tracker',
    });
  }

  const plugin: MarketplacePluginEntry = {
    apiVersion: 'marketplace.backstage.io/v1alpha1',
    kind: 'Plugin',
    metadata: {
      name: packageName,
      title: packageName,
      description: packageInfo.description,
      links,
    },
    spec: {
      type: backstageInfo.role ?? 'frontend-plugin',
      lifecycle: 'unknown',
      owner: 'author',
      developer: author,
      keywords: keywords,
      description: packageInfo.readme ?? packageInfo.description,
      installation: {
        markdown: `# Installation

\`\`\`
yarn install ${packageName}
\`\`\`
`,
      },
    },
  };
  return plugin;
}

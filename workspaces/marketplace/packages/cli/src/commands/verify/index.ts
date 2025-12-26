/*
 * Copyright The Backstage Authors
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

import chalk from 'chalk';
import fs from 'fs-extra';
import { glob } from 'glob';
import yaml from 'yaml';

import {
  isMarketplacePackage,
  isMarketplacePlugin,
  MarketplacePackage,
  MarketplacePlugin,
} from '@red-hat-developer-hub/backstage-plugin-extensions-common';

const packages: Record<string, MarketplacePackage> = {};
const plugins: Record<string, MarketplacePlugin> = {};

export default async () => {
  // TODO use parameter as glob
  const filenames = await glob('**/*.yaml', { ignore: 'node_modules/**' });

  filenames.sort();

  for (const filename of filenames) {
    const content = await fs.readFile(filename, 'utf8');
    const parsed = await yaml.parse(content);

    // Load
    if (Array.isArray(content)) {
      for (const chunk of content) {
        await load(filename, chunk);
      }
    } else {
      await load(filename, parsed);
    }
  }

  // Verify
  verifyPackages();
  verifyPlugins();
};

function stringifyEntityRef(entity: {
  metadata: { namespace?: string; name: string };
}) {
  return `${entity.metadata.namespace ?? 'default'}/${entity.metadata.name}`;
}

function isEntity(
  maybe: object,
): maybe is { apiVersion: string; kind: string } {
  return 'apiVersion' in maybe && 'kind' in maybe;
}

async function load(filename: string, content: any) {
  if (typeof content !== 'object') {
    throw new Error(`Expected object, got ${typeof content}`);
  }

  if (isMarketplacePackage(content)) {
    packages[stringifyEntityRef(content)] = content;
  } else if (isMarketplacePlugin(content)) {
    plugins[stringifyEntityRef(content)] = content;
  } else if (isEntity(content)) {
    console.log(
      `Ignore file ${chalk.blue(filename)} with apiVersion ${content.apiVersion} and kind ${content.kind}`,
    );
  } else {
    console.log(
      `Ignore file ${chalk.blue(filename)} without apiVersion or kind`,
    );
  }
}

async function verifyPackages() {
  for (const pkg of Object.values(packages)) {
    const displayName = pkg.metadata.title ?? pkg.metadata.name ?? 'unknown';
    console.log(`Verifying package ${chalk.blue(displayName)}...`);

    if (!pkg.metadata.title) {
      console.log(`  - missing title`);
    }

    if (pkg.spec?.partOf?.length) {
      for (const partOf of pkg.spec.partOf) {
        if (!plugins[partOf]) {
          console.log(`  - missing plugin ${partOf}`);
        }
      }
    }
  }
}

async function verifyPlugins() {
  for (const plugin of Object.values(plugins)) {
    const displayName =
      plugin.metadata.title ?? plugin.metadata.name ?? 'unknown';
    console.log(`Verifying plugin ${chalk.blue(displayName)}`);

    if (!plugin.metadata.title) {
      console.log(`  - missing title`);
    }

    if (plugin.spec?.packages?.length) {
      for (const pkg of plugin.spec.packages) {
        if (typeof pkg === 'string') {
          if (!packages[pkg]) {
            console.log(`  - missing package ${pkg}`);
          }
        }
      }
    }

    if (!plugin.spec?.documentation?.length) {
      console.log(`  - missing documentation`);
    }
  }
}

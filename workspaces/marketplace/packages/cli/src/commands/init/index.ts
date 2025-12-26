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

import fs from 'fs';
import inquirer, { DistinctQuestion } from 'inquirer';
import glob from 'glob';
import yaml from 'yaml';

import {
  EXTENSIONS_API_VERSION,
  MarketplaceKind,
  MarketplacePackage,
  MarketplacePlugin,
} from '@red-hat-developer-hub/backstage-plugin-extensions-common';

export default async function init() {
  const pluginFolders = await glob.glob('plugins/*/package.json/../');

  const autoGeneratePackages = pluginFolders.length === 0;

  // current working basename
  const cwd = process.cwd().split('/').pop() ?? '';
  // replace spaces with dashes and uppercase all first letters
  const defaultTitle = cwd
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const questions: DistinctQuestion[] = [
    {
      type: 'input',
      name: 'title',
      message: 'Plugin name (display name)',
      default: defaultTitle,
    },
  ];

  if (autoGeneratePackages) {
    questions.push({
      type: 'input',
      name: 'packageName',
      message: 'NPM package name incl. org (e.g. @my-org/my-plugin)',
    });
    questions.push({
      type: 'checkbox',
      name: 'packages',
      message: 'Packages',
      choices: [
        { name: 'Frontend', value: 'frontend', checked: true },
        { name: 'Backend', value: 'backend', checked: true },
      ],
    });
  } else {
    questions.push({
      type: 'checkbox',
      name: 'packages',
      message: 'Packages',
      choices: pluginFolders.map(pluginFolder => ({
        name: pluginFolder,
        value: pluginFolder,
        checked: true,
      })),
    });
  }

  const answers = await inquirer.prompt(questions);

  console.log('answers', answers);

  const { title, packageName, namespace, author } = answers;

  let name = (packageName || (title as string)).toLowerCase().replace(/^@/, '');
  if (name.includes('/')) {
    name = name.substring(name.lastIndexOf('/') + 1);
  }

  const plugin: MarketplacePlugin = {
    apiVersion: EXTENSIONS_API_VERSION,
    kind: MarketplaceKind.Plugin,
    metadata: {
      namespace,
      name,
      title,
      description: 'Plugin summary',
    },
    spec: {
      author,
      description: '# Plugin name\n\nFull plugin description...',
    },
  };
  console.log(yaml.stringify(plugin).trim());

  if (autoGeneratePackages) {
    if (answers.packages.includes('frontend')) {
      const frontendPackage: MarketplacePackage = {
        apiVersion: EXTENSIONS_API_VERSION,
        kind: MarketplaceKind.Package,
        metadata: {
          namespace,
          name: packageName
            .toLowerCase()
            .replace(/^@/, '')
            .replaceAll(/[^a-z0-9]/g, '-'),
          title: packageName,
        },
        spec: {
          packageName,
          version: '0.1.0',
          partOf: [plugin.metadata.name],
        },
      };
      console.log('---');
      console.log(yaml.stringify(frontendPackage).trim());
    }

    if (answers.packages.includes('backend')) {
      const backendPackage: MarketplacePackage = {
        apiVersion: EXTENSIONS_API_VERSION,
        kind: MarketplaceKind.Package,
        metadata: {
          namespace,
          name: `${packageName
            .toLowerCase()
            .replace(/^@/, '')
            .replaceAll(/[^a-z0-9]/g, '-')}-backend`,
          title: `${packageName}-backend`,
        },
        spec: {
          packageName: `${packageName}-backend`,
          version: '0.1.0',
          partOf: [plugin.metadata.name],
        },
      };
      console.log('---');
      console.log(yaml.stringify(backendPackage).trim());
    }
  } else {
    answers.packages.forEach((pluginFolder: string) => {
      const packageJsonPath = `${pluginFolder}/package.json`;
      const packageJson = JSON.parse(
        fs.readFileSync(packageJsonPath, { encoding: 'utf8' }),
      );

      const pkg: MarketplacePackage = {
        apiVersion: EXTENSIONS_API_VERSION,
        kind: MarketplaceKind.Package,
        metadata: {
          namespace,
          name: packageJson.name
            .toLowerCase()
            .replace(/^@/, '')
            .replaceAll(/[^a-z0-9]/g, '-'),
        },
        spec: {
          packageName: packageJson.name,
          version: packageJson.version,
          partOf: [plugin.metadata.name],
        },
      };
      console.log('---');
      console.log(yaml.stringify(pkg).trim());
    });
  }
}

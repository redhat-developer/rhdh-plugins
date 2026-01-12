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

import fs from 'fs-extra';
import { OptionValues } from 'commander';
import path from 'path';
import yaml from 'yaml';
import {
  EXTENSIONS_API_VERSION,
  ExtensionsKind,
  ExtensionsPackage,
  ExtensionsPackageSpecAppConfigExample,
} from '@red-hat-developer-hub/backstage-plugin-extensions-common';
import { EntityLink, LocationEntityV1alpha1 } from '@backstage/catalog-model';
import {
  DynamicPluginsConfig,
  PackageJson,
  PackageJsonBugs,
  PackageJsonPerson,
  PackageJsonRepository,
} from './types';

const DEFAULT_LIFECYCLE = 'unknown';

export default async (opts: OptionValues) => {
  const { defaultDynamicPluginsConfig, outputDir, namespace, owner } = opts as {
    defaultDynamicPluginsConfig?: string;
    outputDir?: string;
    namespace?: string;
    owner?: string;
  };

  const entities: ExtensionsPackage[] = [];

  if (defaultDynamicPluginsConfig) {
    const defaultDynamicPluginsPath = path.resolve(defaultDynamicPluginsConfig);
    const defaultDynamicPluginsContent = fs.readFileSync(
      defaultDynamicPluginsPath,
      'utf8',
    );
    const defaultPluginsConfig = yaml.parse(
      defaultDynamicPluginsContent,
    ) as DynamicPluginsConfig;

    for (const plugin of defaultPluginsConfig.plugins) {
      // find wrappers dir and parse package.json
      // in config the packages are in 'dist' folder (as this is where they are in the container image),
      // but the source code is in 'wrappers' folder
      const wrapperDir = plugin.package.replace('/dist/', '/wrappers/');
      const wrapperPath = path.join(
        path.dirname(defaultDynamicPluginsConfig),
        wrapperDir,
      );
      const packageJSONPath = path.join(wrapperPath, 'package.json');
      const packageJSON = fs.readJsonSync(packageJSONPath) as PackageJson;

      // parse packgeName
      const packageName =
        guessPackageFromDependencies(
          packageJSON.name,
          packageJSON.dependencies,
        ) || packageJSON.name;

      // parse links
      const links: EntityLink[] = [];
      if (packageJSON.homepage) {
        links.push({ url: packageJSON.homepage, title: 'Homepage' });
      }
      if (packageJSON.bugs) {
        const bugs = packageJSON.bugs as PackageJsonBugs;
        if (bugs.url) {
          links.push({ url: bugs.url, title: 'Bugs' });
        } else {
          links.push({ url: packageJSON.bugs as string, title: 'Bugs' });
        }
      }
      let sourceLocation: string = '';
      if (packageJSON.repository) {
        const repo = packageJSON.repository as PackageJsonRepository;
        const url: EntityLink = { title: 'Source Code', url: '' };
        if (repo.url) {
          // try to create a valid github link
          if (repo.url.startsWith('https://github.com')) {
            url.url = `${repo.url}/tree/main/${repo.directory}`;
          } else {
            url.url = `${repo.url}/${repo.directory}`;
          }
        } else {
          url.url = packageJSON.repository as string;
        }
        links.push(url);
        sourceLocation = `url ${url.url}`;
      }

      // parse author
      let author: string = '';
      if (packageJSON.author) {
        const a = packageJSON.author as PackageJsonPerson;
        if (a.name) {
          author = a.name;
          author += a.email ? ` <${a.email}>` : '';
          author += a.url ? ` (${a.url})` : '';
        } else {
          author = packageJSON.author as string;
        }
      }

      // parse partOf
      const partOf: string[] = [];
      if (packageJSON.backstage?.pluginId) {
        if (packageJSON.backstage?.role === 'backend-plugin-module') {
          const scope = getScope(packageName);
          const module = getModuleName(packageName);
          let pof = '';
          if (scope) {
            pof = `${scope}-`;
          }
          if (module) {
            pof += `${module}-`;
          }
          pof += `${packageJSON.backstage.pluginId}-module`;
          partOf.push(pof);
        } else {
          partOf.push(packageJSON.backstage.pluginId);
        }
      }

      // parse config examples
      const appConfigExamples: ExtensionsPackageSpecAppConfigExample[] = [];
      if (plugin.pluginConfig) {
        appConfigExamples.push({
          title: 'Default configuration',
          content: plugin.pluginConfig,
        });
      }

      const entity: ExtensionsPackage = {
        apiVersion: EXTENSIONS_API_VERSION,
        kind: ExtensionsKind.Package,
        metadata: {
          name: entityName(packageJSON.name),
          namespace: namespace ?? undefined,
          title: packageName,
          links: links,
          annotations: {
            'backstage.io/source-location': sourceLocation,
          },
          tags: packageJSON.keywords?.filter(
            (k: string) =>
              !k.startsWith('support:') && !k.startsWith('lifecycle:'),
          ),
        },
        spec: {
          owner: owner,
          packageName: packageName,
          dynamicArtifact: plugin.package,
          version: packageJSON.version,
          backstage: {
            role: packageJSON.backstage?.role,
            supportedVersions: packageJSON.backstage?.['supported-versions'],
          },
          author: author,
          lifecycle:
            packageJSON.keywords
              ?.find((k: string) => k.startsWith('lifecycle:'))
              ?.split(':')[1] ?? DEFAULT_LIFECYCLE,
          partOf: partOf,
          appConfigExamples: appConfigExamples,
        },
      };

      entities.push(entity);
    }
  }

  if (outputDir) {
    const outputDirPath = path.resolve(outputDir);
    await fs.ensureDir(outputDirPath);

    const location: LocationEntityV1alpha1 = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Location',
      metadata: {
        namespace,
        name: 'packages',
      },
      spec: {
        targets: [],
      },
    };

    for (const entity of entities) {
      const filename = `${entity.metadata.name}.yaml`;
      const entityPath = path.join(outputDirPath, filename);
      await fs.writeFile(entityPath, yaml.stringify(entity));
      location.spec.targets?.push(`./${filename}`);
    }
    await fs.writeFile(
      path.join(outputDirPath, 'all.yaml'),
      yaml.stringify(location),
    );
  } else {
    for (const entity of entities) {
      console.log(yaml.stringify(entity));
      console.log('---');
    }
  }
};

/**
 * Convert a given string into a valid entity name
 */
function entityName(str: string): string {
  let name = str
    .toLowerCase()
    .replace(/[^a-z0-9-_.]/g, '-') // replace invalid characters with '-'
    .replace(/-+/g, '-'); // replace multiple '-' with a single '-'

  // Remove leading and trailing '-'
  if (name.startsWith('-')) {
    name = name.substring(1);
  }
  if (name.endsWith('-')) {
    name = name.slice(0, -1);
  }

  if (name.length > 63) {
    name = name.substring(0, 63);
  }

  return name;
}

/**
 * Guess the correct package name that was warpped from the dependencies list of a wrapper
 */
function guessPackageFromDependencies(
  pkgname: string,
  dependencies?: Record<string, string>,
): string | undefined {
  if (!dependencies) {
    return undefined;
  }

  if (Object.keys(dependencies).length === 1) {
    return Object.keys(dependencies)[0];
  }

  for (const dep of Object.keys(dependencies)) {
    const convertedName = dep.replaceAll('/', '-').replaceAll('@', '');
    if (convertedName === pkgname) {
      return dep;
    }
  }
  return undefined;
}

/**
 * Get scope form npm package name (withouth @)
 */
function getScope(pkgname: string): string | undefined {
  if (pkgname.startsWith('@')) {
    return pkgname.split('/')[0].substring(1);
  }
  return undefined;
}

/**
 * Get module name from npm package name
 * module name is the string after '-module-' string from package name
 */
function getModuleName(pkgname: string): string | undefined {
  const parts = pkgname.split('-module-');
  if (parts.length > 1) {
    return parts[1];
  }
  return undefined;
}

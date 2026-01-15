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
import chalk from 'chalk';
import { Entity } from '@backstage/catalog-model';
import {
  isExtensionsPackage,
  isExtensionsPlugin,
  ExtensionsPackage,
  ExtensionsPlugin,
} from '@red-hat-developer-hub/backstage-plugin-extensions-common';
import type { OptionValues } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import YAML from 'yaml';
import glob from 'glob';
import { JsonValue } from '@backstage/types';

/** A simple helper class to generate CSV files */
class CSVGenerator<T> {
  /** The columns to be included in the CSV. */
  private readonly columns: {
    /**
     * The column key to be used in the CSV header. It must not contain commas,
     * newlines, quotes, or anything else that could break the CSV format. It
     * does not have to be unique.
     *
     * Each column key stores a getter function that takes a row and returns
     * the value to be included in the CSV.
     */
    [key: string]: (cell: T) => JsonValue | undefined;
  };

  /** The rows to be included in the CSV */
  private readonly rows: T[];

  constructor(
    columns: CSVGenerator<T>['columns'],
    rows: CSVGenerator<T>['rows'] = [],
  ) {
    this.columns = columns;
    this.rows = rows;
  }

  /** Escape problematic characters in a CSV cell */
  static readonly escapeCSVCell = (cell: string) => {
    const removedNewLines = cell.replace(/\n/g, '\\n');
    const regex = /[\s,"]/;

    // adapted from https://stackoverflow.com/a/47340986
    if (regex.exec(removedNewLines.replace(/ /g, ''))) {
      return `"${removedNewLines.replace(/"/g, '""')}"`;
    }

    return removedNewLines;
  };

  /** Add a row to the CSV */
  addRow(row: T) {
    this.rows.push(row);
  }

  /**
   * @param includeHeader Whether to include the header row in the CSV
   * @returns A CSV generated from the rows and columns provided
   */
  generate(includeHeader = true): string {
    const header = Object.keys(this.columns)
      .map(key => CSVGenerator.escapeCSVCell(key))
      .join(',');
    const rows = this.rows
      .map(row =>
        Object.values(this.columns)
          .map(column => CSVGenerator.escapeCSVCell(String(column(row) || '')))
          .join(','),
      )
      .join('\n');

    return includeHeader ? `${header}\n${rows}` : rows;
  }
}

/**
 * A type guard for Entity
 *
 * @param entity Some unknown object to check
 * @returns Whether the entity is an Entity
 */
const isEntity = (entity: any): entity is Entity => {
  return (
    !!entity &&
    typeof entity === 'object' &&
    'apiVersion' in entity &&
    'kind' in entity
  );
};

/**
 * Parse a list of YAML files into a list of entities
 * @param yamls The list of paths of YAML files to parse
 * @returns A list of entities
 */
const parseYamls = async (yamls: string[], recurse = false) => {
  return await Promise.all(
    (yamls || []).flatMap(basePath => {
      return glob
        .sync(recurse ? '**/*.yaml' : '*.yaml', { cwd: basePath })
        .map(async (file: string) => {
          const fileContent = await fs.readFile(
            path.join(basePath, file),
            'utf-8',
          );

          // read each individual plugin from the file
          const plugins = YAML.parseAllDocuments(fileContent)
            .map(doc => doc.toJS())
            .filter(isEntity);
          return plugins;
        });
    }),
  ).then(plugins => plugins.flat());
};

const getPackagesOfType = (
  packages: string[],
  allPackages: Record<string, ExtensionsPackage>,
  types: string[],
): string => {
  return packages
    .map(name => {
      const pkg = allPackages[name];
      if (!pkg) {
        console.error(
          chalk.red(`Package ${name} not found in the list of packages`),
        );
        return '';
      }

      const version = pkg.spec?.version
        ? `(${pkg.spec?.version})`
        : '(no version)';

      if (types.includes(pkg?.spec?.backstage?.role || '')) {
        return `${pkg.spec?.packageName} ${version}`;
      }

      return '';
    })
    .filter(Boolean)
    .join(', ');
};

export default async ({
  outputFile,
  pluginsYamlPath,
  recursive,
  type,
}: OptionValues) => {
  if (!pluginsYamlPath) {
    console.error(
      'No plugins path provided! Provide one using --plugins-yaml-path',
    );
    process.exit(1);
  }

  /** Parse the YAML files into entities */
  const yamls = parseYamls(pluginsYamlPath.split(','), recursive);

  /** A map of all packages */
  const packages: Record<string, ExtensionsPackage> = {};

  /** The generator for backstage extensions Packages */
  const packageCSV = new CSVGenerator<ExtensionsPackage>({
    name: yaml => yaml?.metadata?.name,
    title: yaml => yaml?.metadata?.title,
    version: yaml => yaml?.spec?.version,
    author: yaml =>
      yaml?.spec?.developer ||
      yaml?.spec?.author ||
      yaml?.spec?.owner ||
      ((yaml?.spec?.authors as string[]) || []).join(','),

    lifecycle: yaml => yaml?.spec?.lifecycle,
    packages: yaml => (yaml?.spec?.partOf || []).join(', '),
    role: yaml => yaml?.spec?.role || yaml?.spec?.backstage?.role,
  });

  /** The generator for backstage extensions Plugins */
  const pluginCSV = new CSVGenerator<ExtensionsPlugin>({
    name: p => p?.metadata?.name,
    title: p => p?.metadata?.title,
    author: p =>
      p?.spec?.developer ||
      p?.spec?.author ||
      p?.spec?.owner ||
      (p?.spec?.authors || [])?.map(a => a.name).join(', '),
    categories: p => ((p?.spec?.categories as string[]) || []).join(', '),
    lifecycle: p => p?.spec?.lifecycle,
    metadataDescription: p => p?.metadata?.description,
    specDescription: p => p?.spec?.description,
    support: p => p?.spec?.support,
    publisher: p => p?.spec?.publisher,
    highlights: p => (p?.spec?.highlights || []).join(', '),
    'certified-by': p =>
      p?.metadata?.annotations?.['extensions.backstage.io/certified-by'],
    'verified-by': p =>
      p?.metadata?.annotations?.['extensions.backstage.io/verified-by'],
    'pre-installed': p =>
      p?.metadata?.annotations?.['extensions.backstage.io/pre-installed'],
    packages: p => (p?.spec?.packages || []).join(', '),
    'backend packages': p =>
      getPackagesOfType(p?.spec?.packages || [], packages, [
        'backend-plugin',
        'backend-plugin-module',
      ]),
    'frontend packages': p =>
      getPackagesOfType(p?.spec?.packages || [], packages, ['frontend-plugin']),
  });

  /** Process each YAML file */
  for (const yaml of await yamls) {
    if (isExtensionsPackage(yaml)) {
      packages[yaml.metadata.name] = yaml;
      packageCSV.addRow(yaml);
    } else if (isExtensionsPlugin(yaml)) {
      pluginCSV.addRow(yaml);
    }
  }

  /** Generate the final CSV */
  const csvs: Record<string, string> = {};

  switch (type) {
    case 'plugin':
      csvs['-plugins.csv'] = pluginCSV.generate();
      break;
    case 'package':
      csvs['-packages.csv'] = packageCSV.generate();
      break;
    case 'all':
    default:
      csvs['-plugins.csv'] = pluginCSV.generate();
      csvs['-packages.csv'] = packageCSV.generate();
      break;
  }

  for (const [suffix, csv] of Object.entries(csvs)) {
    if (!outputFile) {
      console.log(csv);
      continue;
    }

    await fs.writeFile(`${outputFile}${suffix}`, csv);
  }

  process.exit(0);
};

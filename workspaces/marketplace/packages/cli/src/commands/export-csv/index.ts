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
import { Entity } from '@backstage/catalog-model/index';
import {
  isMarketplacePackage,
  isMarketplacePlugin,
  MarketplacePackage,
  MarketplacePlugin,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import type { OptionValues } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import YAML from 'yaml';
import glob from 'glob';

/** A simple helper class to generate CSV files */
class CSVGenerator<T> {
  /** The columns to be included in the CSV. */
  private readonly columns: {
    /**
     * The column key to be used in the CSV header. It must not contain commas,
     * newlines, quotes, or anything else that could break the CSV format. It
     * does not have to be unique.
     */
    key: string;
    /** The getter function for each cell. */
    getter: (cell: T) => string | number | undefined | null;
  }[];

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

    return cell;
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
    const header = this.columns.map(column => column.key).join(',');
    const rows = this.rows
      .map(row =>
        this.columns
          .map(column =>
            CSVGenerator.escapeCSVCell(String(column.getter(row) || '')),
          )
          .join(','),
      )
      .join('\n');

    return includeHeader ? `${header}\n${rows}` : rows;
  }
}

/**
 * Zips two arrays `keys` and `getters` into an array of CSVGenerator columns.
 *
 * `keys` and `getters` must have the same length.
 *
 * @param keys The keys to be used in the CSV header
 * @param getters The getter functions for each cell
 */
const getColumns = <T = any>(keys: string[], getters: ((obj: T) => any)[]) =>
  keys.map((key, index) => ({ key, getter: getters[index] }));

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
  allPackages: Record<string, MarketplacePackage>,
  types: string[],
): string => {
  return packages
    .map(name => {
      const pkg = allPackages[name];
      if (!pkg) {
        console.error(`Package ${name} not found in the list of packages`);
        return '';
      }

      const version = pkg.metadata.version
        ? `(${pkg.metadata.version})`
        : '(no version)';

      if (types.includes(pkg?.spec?.backstage?.role || '')) {
        return `${pkg.metadata.name}${version}`;
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
}: OptionValues) => {
  if (!pluginsYamlPath) {
    console.error(
      'No plugins path provided! Provide one using --plugins-yaml-path',
    );
    process.exit(1);
  }

  /** Parse the YAML files into entities */
  const yamls = parseYamls(pluginsYamlPath.split(','), recursive);

  /** The headers we want to include in the CSV */
  const headers = [
    'type',
    'name',
    'title',
    'description',
    'author',
    'categories',
    'lifecycle',
    'packages',
    'role',
    'backend plugins',
    'frontend plugins',
  ];

  /** A hashmap of packages for the plugins CSV generator */
  const packages: Record<string, MarketplacePackage> = {};

  /** The generator for backstage marketplace Packages */
  const packageCSV = new CSVGenerator<MarketplacePackage>(
    getColumns<MarketplacePackage>(headers, [
      () => 'Package',
      yaml => yaml?.metadata?.name,
      yaml => yaml?.metadata?.title,
      () => undefined, // packages don't have a description in their type
      yaml =>
        yaml?.spec?.developer ||
        yaml?.spec?.author ||
        yaml?.spec?.owner ||
        ((yaml?.spec?.authors as string[]) || []).join(','),
      () => undefined, // packages don't have categories in their type
      yaml => yaml?.spec?.lifecycle,
      yaml => (yaml?.spec?.partOf || []).join(', '),
      yaml => yaml?.spec?.role || yaml?.spec?.backstage?.role,
      () => undefined, // packages don't have backend plugins in their type
      () => undefined, // packages don't have frontend plugins in their type
    ]),
  );

  /** The generator for backstage marketplace Plugins */
  const pluginCSV = new CSVGenerator<MarketplacePlugin>(
    getColumns<MarketplacePlugin>(headers, [
      () => 'Plugin',
      p => p?.metadata?.name,
      p => p?.metadata?.title,
      p => p?.metadata?.description,
      p =>
        p?.spec?.developer ||
        p?.spec?.author ||
        p?.spec?.owner ||
        (p?.spec?.authors || []).join(','),
      p => ((p?.spec?.categories as string[]) || []).join(', '),
      p => p?.spec?.lifecycle,
      p => (p?.spec?.packages || []).join(', '),
      () => undefined, // plugins don't have a role in their type
      p =>
        getPackagesOfType(p?.spec?.packages || [], packages, [
          'backend-plugin',
          'backend-plugin-module',
        ]),
      p =>
        getPackagesOfType(p?.spec?.packages || [], packages, [
          'frontend-plugin',
        ]),
    ]),
  );

  /** Process each YAML file */
  for (const yaml of await yamls) {
    if (isMarketplacePackage(yaml)) {
      packages[yaml.metadata.name] = yaml;
      packageCSV.addRow(yaml);
    } else if (isMarketplacePlugin(yaml)) {
      pluginCSV.addRow(yaml);
    }
  }

  /** Generate the final CSV */
  const finalCSV = `${packageCSV.generate()}${pluginCSV.generate(false)}`;

  if (!outputFile) {
    console.log(finalCSV);
  } else {
    await fs.writeFile(outputFile, finalCSV);
  }

  process.exit(0);
};

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
import { OptionValues } from 'commander';
import path from 'path';
import YAML from 'yaml';
import fs from 'fs-extra';
import {
  isMarketplacePackage,
  isMarketplacePlugin,
  MarketplacePackage,
  MarketplacePlugin,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import { Entity } from '@backstage/catalog-model/index';
import { PackageJson } from '../generate/types';

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
    /** The getter function for each cell. The return value must be castable to a string */
    getter: (plugin: T) => any;
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
 * @param entity The entity to check
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
const parseYamls = async (yamls: string[]) => {
  return await Promise.all(
    (yamls || []).flatMap(basePath => {
      return fs
        .readdirSync(basePath)
        .filter(f => f.endsWith('.yaml'))
        .map(async (file: string) => {
          const fileContent = await fs.readFile(
            path.join(basePath, file),
            'utf-8',
          );

          // read each individual plugin from the file
          const plugins = fileContent
            .split('\n---\n')
            .filter(Boolean)
            .map((plugin: string) => {
              return YAML.parse(plugin);
            })
            .filter(isEntity);
          return plugins;
        });
    }),
  ).then(plugins => plugins.flat());
};

/**
 * Fetches a `package.json` from a given package from the npm registry.
 * @param packageName The name of the package to fetch
 * @returns The package.json object
 */
const fetchNpmPackageJson = async (packageName: string, version: string) => {
  const response = await fetch(
    `https://registry.npmjs.org/${packageName}/${version}`,
  );

  return await response.json();
};

type CombinedPackage = {
  yaml: MarketplacePackage;
  pkg: PackageJson;
};

export default async ({ outputFile, pluginsYamlPath }: OptionValues) => {
  if (!pluginsYamlPath) {
    console.error('No plugins path provided!');
    process.exit(1);
  }

  const yamls = parseYamls(pluginsYamlPath.split(','));

  /** The headers we want to include in the CSV */
  const headers = [
    'name',
    'title',
    'description',
    'developer',
    'categories',
    'lifecycle',
    'icon',
  ];

  /** The generator for backstage marketplace Packages */
  const packageCSV = new CSVGenerator<CombinedPackage>(
    getColumns<CombinedPackage>(headers, [
      ({ yaml }) => yaml?.metadata?.name,
      ({ yaml }) => yaml?.metadata?.title,
      ({ pkg }) => pkg.description,
      ({ yaml }) =>
        yaml?.spec?.developer ||
        yaml?.spec?.author ||
        yaml?.spec?.owner ||
        ((yaml?.spec?.authors as string[]) || []).join(','),
      ({ pkg }) => (pkg?.keywords || []).join(', '),
      ({ yaml }) => yaml?.spec?.lifecycle,
      ({ yaml }) => yaml?.spec?.icon,
    ]),
  );

  /** The generator for backstage marketplace Plugins */
  const pluginCSV = new CSVGenerator<MarketplacePlugin>(
    getColumns<MarketplacePlugin>(headers, [
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
      p => p?.spec?.icon,
    ]),
  );

  for (const yaml of await yamls) {
    if (isMarketplacePackage(yaml)) {
      const pkg = await fetchNpmPackageJson(
        yaml!.spec!.packageName as string,
        yaml!.spec!.version as string,
      );
      packageCSV.addRow({ yaml, pkg });
    } else if (isMarketplacePlugin(yaml)) {
      pluginCSV.addRow(yaml);
    }
  }

  const finalCSV = `${packageCSV.generate()}${pluginCSV.generate(false)}`;

  if (!outputFile) {
    console.log(finalCSV);
  } else {
    await fs.writeFile(outputFile, finalCSV);
  }

  process.exit(0);
};

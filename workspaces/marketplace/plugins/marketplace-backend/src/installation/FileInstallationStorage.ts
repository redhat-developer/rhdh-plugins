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

import { Document, isMap, parseDocument, YAMLMap, YAMLSeq } from 'yaml';
import {
  validateConfigurationFormat,
  validatePackageFormat,
  validatePluginFormat,
} from '../validation/configValidation';
import {
  InstallationInitError,
  InstallationInitErrorReason,
} from '../errors/InstallationInitError';
import type { JsonValue } from '@backstage/types';

export interface InstallationStorage {
  initialize?(): void;
  getPackage(packageName: string): string | undefined;
  updatePackage(packageName: string, newConfig: string): void;
  getPackages(packageNames: Set<string>): string | undefined;
  updatePackages(packageNames: Set<string>, newConfig: string): void;
  setPackageDisabled(packageName: string, disabled: boolean): void;
  setPackagesDisabled(packageNames: Set<string>, disabled: boolean): void;
}

export class FileInstallationStorage implements InstallationStorage {
  private readonly configFile: string;
  private config: Document;

  constructor(configFile: string) {
    this.configFile = configFile;
    this.config = new Document();
  }

  private get packages(): YAMLSeq<YAMLMap<string, JsonValue>> {
    return this.config.get('plugins') as YAMLSeq<YAMLMap<string, JsonValue>>;
  }

  private toStringYaml(mapNodes: YAMLMap<string, JsonValue>[]): string {
    const tempDoc = new Document(mapNodes);
    return tempDoc.toString({ lineWidth: 0 });
  }

  private getPackageYamlMap(
    packageName: string,
  ): YAMLMap<string, JsonValue> | undefined {
    return this.packages.items.find(
      p => isMap(p) && p.get('package') === packageName,
    );
  }

  private save() {
    fs.writeFileSync(this.configFile, this.config.toString({ lineWidth: 0 }));
  }

  initialize(): void {
    if (!fs.existsSync(this.configFile)) {
      throw new InstallationInitError(
        InstallationInitErrorReason.FILE_NOT_EXISTS,
        `The file ${this.configFile} is missing`,
      );
    }
    const rawContent = fs.readFileSync(this.configFile, 'utf-8');
    const parsedContent = parseDocument(rawContent);
    validateConfigurationFormat(parsedContent);
    this.config = parsedContent;
  }

  getConfigYaml(): string {
    return this.config.toString({ lineWidth: 0 });
  }

  getPackage(packageName: string): string | undefined {
    const res = this.getPackageYamlMap(packageName);
    return res ? this.toStringYaml([res]) : res;
  }

  getPackages(packageNames: Set<string>): string | undefined {
    const res = [];
    for (const packageName of packageNames) {
      const packageMap = this.getPackageYamlMap(packageName);
      if (packageMap) {
        res.push(packageMap);
      }
    }
    return res.length === 0 ? undefined : this.toStringYaml(res);
  }

  updatePackage(packageName: string, newConfig: string): void {
    const newNode = parseDocument(newConfig).contents;
    validatePackageFormat(newNode, packageName);

    const existingPackage = this.packages.items.find(
      item => item.get('package') === packageName,
    );
    if (existingPackage) {
      existingPackage.items = newNode.items;
    } else {
      this.packages.items.push(newNode);
    }
    this.save();
  }

  updatePackages(packageNames: Set<string>, newConfig: string): void {
    const newNodes = parseDocument(newConfig);
    validatePluginFormat(newNodes, packageNames);

    const updatedPackages = new YAMLSeq<YAMLMap<string, JsonValue>>();
    for (const item of this.packages.items) {
      const name = item.get('package') as string;
      if (!packageNames.has(name)) {
        updatedPackages.items.push(item); // keep unchanged package of different plugin
      }
    }
    updatedPackages.items.push(...newNodes.contents.items);

    this.config.set('plugins', updatedPackages);
    this.save();
  }

  setPackageDisabled(packageName: string, disabled: boolean) {
    let pkg = this.getPackageYamlMap(packageName);
    if (!pkg) {
      pkg = new YAMLMap<string, JsonValue>();
      pkg.set('package', packageName);
      this.packages.add(pkg);
    }
    pkg.set('disabled', disabled);
    this.save();
  }

  setPackagesDisabled(packageNames: Set<string>, disabled: boolean) {
    const packages = this.config.get('plugins') as YAMLSeq<
      YAMLMap<string, JsonValue>
    >;
    const packageMap = packages.items.reduce(
      (map, item) => map.set(item.get('package') as string, item),
      new Map<string, YAMLMap<string, JsonValue>>(),
    );
    for (const packageName of packageNames) {
      let item = packageMap.get(packageName);
      if (!item) {
        item = new YAMLMap<string, JsonValue>();
        item.set('package', packageName);
        packages.add(item);
      }
      item.set('disabled', disabled);
    }

    this.save();
  }
}

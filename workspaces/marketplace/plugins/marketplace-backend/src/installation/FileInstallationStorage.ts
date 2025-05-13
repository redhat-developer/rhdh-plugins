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

import { Document, isMap, isSeq, parseDocument, YAMLMap, YAMLSeq } from 'yaml';

export interface InstallationStorage {
  initialize?(): void;
  getPackage(packageName: string): string | undefined;
  getPackages(packageNames: Iterable<string>): string | undefined;
}

export class FileInstallationStorage implements InstallationStorage {
  private readonly configFile: string;
  private config: Document;

  constructor(configFile: string) {
    this.configFile = configFile;
    this.config = new Document();
  }

  private validateConfigFormat(doc: Document) {
    const plugins = doc.get('plugins');

    if (!isSeq(plugins))
      throw new Error(
        "Failed to load 'extensions.installation.saveToSingleFile.file'. Invalid content, format of the 'plugins' field must be a list",
      );
    for (const item of plugins.items) {
      this.validatePackageFormat(item);
    }
  }

  private validatePackageFormat(item: unknown) {
    if (!isMap(item)) {
      throw new Error('Invalid content, format of package must be a map');
    }

    const packageName = item.get('package');
    if (typeof packageName !== 'string' || packageName.trim() === '') {
      throw new Error('Invalid content, package must be a non-empty string');
    }

    const disabled = item.get('disabled');
    if (disabled && typeof disabled !== 'boolean') {
      throw new Error('Invalid content, disabled must be a boolean');
    }

    const pluginConfig = item.get('pluginConfig');
    if (pluginConfig && !isMap(pluginConfig)) {
      throw new Error('Invalid content, pluginConfig must be a map');
    }
  }

  private toStringYaml(mapNodes: YAMLMap[]): string {
    const tempDoc = new Document(mapNodes);
    return tempDoc.toString();
  }

  private getPackageYamlMap(packageName: string): YAMLMap | undefined {
    const packages = this.config.get('plugins') as YAMLSeq;
    const res = packages.items.find(
      p => isMap(p) && p.get('package') === packageName,
    ) as YAMLMap | undefined;
    return res;
  }

  initialize(): void {
    const rawContent = fs.readFileSync(this.configFile, 'utf-8');
    const parsedContent = parseDocument(rawContent);
    this.validateConfigFormat(parsedContent);
    this.config = parsedContent;
  }

  getConfigYaml(): string {
    return this.config.toString();
  }

  getPackage(packageName: string): string | undefined {
    const res = this.getPackageYamlMap(packageName);
    return res ? this.toStringYaml([res]) : res;
  }

  getPackages(packageNames: Iterable<string>): string | undefined {
    const res = [];
    for (const packageName of packageNames) {
      const packageMap = this.getPackageYamlMap(packageName);
      if (packageMap) {
        res.push(packageMap);
      }
    }
    return res.length === 0 ? undefined : this.toStringYaml(res);
  }
}

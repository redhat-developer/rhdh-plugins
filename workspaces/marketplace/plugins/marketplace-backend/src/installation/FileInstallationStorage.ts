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
import { validateConfigurationFormat } from '../validation/configValidation';

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
    validateConfigurationFormat(parsedContent);
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

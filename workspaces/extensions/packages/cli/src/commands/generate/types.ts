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

import { JsonObject } from '@backstage/types';

export interface DynamicPluginsConfig {
  plugins: DynamicPluginConfig[];
}

export interface DynamicPluginConfig {
  package: string;
  disabled: boolean;
  pluginConfig: JsonObject;
}

export interface PackageJson {
  name: string;
  version: string;
  description?: string;
  keywords?: string[];
  homepage?: string;
  bugs?: string | PackageJsonBugs;
  license?: string;
  author?: string | PackageJsonPerson;
  contributors?: string[] | PackageJsonPerson[];
  files?: string[];
  exports?: string | Record<string, string>;
  main?: string;
  browser?: string;
  bin?: Record<string, string>;
  man?: string;
  directories?: Record<string, string>;
  repository?: string | PackageJsonRepository;
  scripts?: Record<string, string>;
  config?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  bundledDependencies?: string[];
  optionalDependencies?: Record<string, string>;
  overrides?: Record<string, string>;
  engines?: Record<string, string>;
  os?: string[];
  cpu?: string[];

  backstage?: PackageJsonBackstage;
}

export interface PackageJsonBackstage {
  role?: string;
  'supported-versions'?: string;
  pluginId?: string;
  pluginPackage?: string;
}

export interface PackageJsonBugs {
  email?: string;
  url?: string;
}

export interface PackageJsonPerson {
  name: string;
  email?: string;
  url?: string;
}

export interface PackageJsonRepository {
  type?: string;
  url?: string;
  directory?: string;
}

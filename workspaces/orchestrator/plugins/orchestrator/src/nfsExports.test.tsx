/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
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
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import plugin, {
  orchestratorEntityContent,
  orchestratorPage,
  orchestratorTranslationsModule,
} from './index';
import translationsModuleDefault from './orchestratorTranslationsModuleExport';

const ORCHESTRATOR_EXTENSION_IDS = [
  'page:orchestrator',
  'api:orchestrator',
  'entity-content:orchestrator/workflows',
] as const;

function registeredExtensionIds(frontendPlugin: object): string[] {
  const extensions = (
    frontendPlugin as { extensions?: ReadonlyArray<{ id: string }> }
  ).extensions;
  if (!extensions) {
    throw new Error('plugin.extensions is missing');
  }
  return extensions.map(extension => extension.id);
}

const nfsPluginSource = readFileSync(resolve(__dirname, 'index.tsx'), 'utf8');

describe('orchestrator NFS plugin', () => {
  it('should export a valid frontend plugin', () => {
    expect(plugin).toBeDefined();
    expect(plugin.$$type).toBe('@backstage/FrontendPlugin');
  });

  it('should have the correct plugin id', () => {
    expect(plugin.id).toBe('orchestrator');
  });

  it('should have routes defined', () => {
    expect(plugin.routes).toBeDefined();
    expect(plugin.routes).toHaveProperty('root');
  });

  it('registers the NFS extensions on the plugin', () => {
    const extensionIds = registeredExtensionIds(plugin);
    expect(extensionIds).toEqual(
      expect.arrayContaining([...ORCHESTRATOR_EXTENSION_IDS]),
    );
  });

  it('should export a translations module targeting the app plugin', () => {
    expect(orchestratorTranslationsModule).toBeDefined();
    expect(orchestratorTranslationsModule.$$type).toBe(
      '@backstage/FrontendModule',
    );
  });

  it('should export the translations module as default for NFS discovery', () => {
    expect(translationsModuleDefault).toBe(orchestratorTranslationsModule);
  });
});

describe('orchestrator NFS Recipe A', () => {
  it('declares the Workflows entity content title and path the catalog reads', () => {
    expect(orchestratorEntityContent).toBeDefined();
    expect(nfsPluginSource).toMatch(
      /EntityContentBlueprint\.make\(\{[\s\S]*?name:\s*'workflows'[\s\S]*?path:\s*'\/workflows'[\s\S]*?title:\s*'Workflows'/,
    );
  });

  it('declares the Orchestrator page title and path', () => {
    expect(orchestratorPage).toBeDefined();
    expect(nfsPluginSource).toMatch(
      /PageBlueprint\.make\(\{[\s\S]*?path:\s*'\/orchestrator'[\s\S]*?title:\s*'Orchestrator'/,
    );
  });
});

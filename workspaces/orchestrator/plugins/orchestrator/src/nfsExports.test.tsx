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
import { coreExtensionData } from '@backstage/frontend-plugin-api';
import {
  createExtensionTester,
  renderInTestApp,
} from '@backstage/frontend-test-utils';
import { EntityProvider } from '@backstage/plugin-catalog-react';
import { EntityContentBlueprint } from '@backstage/plugin-catalog-react/alpha';
import { TestApiProvider } from '@backstage/test-utils';

import { screen, waitFor } from '@testing-library/react';

import { orchestratorApiRef } from './api';
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

const mockEntity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'greeting-component',
    namespace: 'default',
    annotations: {
      'orchestrator.io/workflows': JSON.stringify(['greeting']),
    },
  },
  spec: {
    type: 'service',
    owner: 'guest',
  },
};

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
    const tester = createExtensionTester(orchestratorEntityContent);

    expect(tester.get(EntityContentBlueprint.dataRefs.title)).toBe('Workflows');
    expect(tester.get(coreExtensionData.routePath)).toBe('/workflows');
  });

  it('declares the Orchestrator page title and path', () => {
    const tester = createExtensionTester(orchestratorPage);

    expect(tester.get(coreExtensionData.routePath)).toBe('/orchestrator');
    expect(tester.get(coreExtensionData.title)).toBe('Orchestrator');
  });

  it('renders entity content when apis are provided to renderInTestApp', async () => {
    const tester = createExtensionTester(orchestratorEntityContent);
    const mockApi = {
      listWorkflowOverviews: jest.fn(),
      getWorkflowsOverviewForEntity: jest.fn().mockResolvedValue({
        data: { overviews: [] },
      }),
    };

    await renderInTestApp(
      <TestApiProvider apis={[[orchestratorApiRef, mockApi]]}>
        <EntityProvider entity={mockEntity}>
          {tester.reactElement()}
        </EntityProvider>
      </TestApiProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('No workflows added yet')).toBeTruthy();
    });
  });
});

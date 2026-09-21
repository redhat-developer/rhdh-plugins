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

import { createElement } from 'react';
import {
  coreExtensionData,
  createFrontendModule,
} from '@backstage/frontend-plugin-api';
import { renderTestApp } from '@backstage/frontend-test-utils';

import aiCatalogPlugin, * as publicExports from './index';
import {
  AiCatalogFilterBlueprint,
  filterDefinitionDataRef,
} from './blueprints/AiCatalogFilterBlueprint';
import translationsModuleDefault, {
  aiCatalogTranslationRef,
  aiCatalogTranslations,
  aiCatalogTranslationsModule,
} from './translations';

describe('AI Catalog NFS exports', () => {
  it('exposes the frontend plugin through the existing default-export contract', () => {
    expect(aiCatalogPlugin.$$type).toBe('@backstage/FrontendPlugin');
    expect(aiCatalogPlugin.pluginId).toBe('ai-catalog');
    expect(Object.keys(publicExports).sort()).toEqual([
      'AiCatalogFilterBlueprint',
      'aiCatalogTranslationRef',
      'aiCatalogTranslations',
      'aiCatalogTranslationsModule',
      'default',
      'filterDefinitionDataRef',
    ]);
  });

  it('registers the page, filters, and entity cards under the AI Catalog namespace', () => {
    const ids = [
      'page:ai-catalog/ai-catalog',
      'ai-catalog-filter:ai-catalog/category',
      'ai-catalog-filter:ai-catalog/owner',
      'ai-catalog-filter:ai-catalog/provider',
      'ai-catalog-filter:ai-catalog/tags',
      'entity-card:ai-catalog/ai-asset-details',
      'entity-card:ai-catalog/agent-instructions',
      'entity-card:ai-catalog/usage',
    ] as const;
    for (const id of ids) {
      const [kind, name] = id.split(':ai-catalog/');
      expect(aiCatalogPlugin.getExtension(id)).toMatchObject({
        kind,
        name,
        namespace: 'ai-catalog',
      });
    }
  });

  it.each([
    { disabledFilters: [], expected: 'lifecycle,owner,provider,tag,type' },
    { disabledFilters: ['owner'], expected: 'lifecycle,provider,tag,type' },
    { disabledFilters: ['owner', 'tags'], expected: 'lifecycle,provider,type' },
  ])(
    'applies filter disablement and third-party attachment with $disabledFilters disabled',
    async ({ disabledFilters, expected }) => {
      const page = aiCatalogPlugin
        .getExtension('page:ai-catalog/ai-catalog')
        .override({
          factory: (_original, { inputs }) => [
            coreExtensionData.reactElement(
              createElement(
                'div',
                null,
                inputs.filters
                  .map(input => input.get(filterDefinitionDataRef).urlParam)
                  .sort()
                  .join(','),
              ),
            ),
            coreExtensionData.routePath('/ai-catalog'),
          ],
        });
      const customFilter = AiCatalogFilterBlueprint.make({
        name: 'lifecycle',
        params: {
          urlParam: 'lifecycle',
          label: 'Lifecycle',
          getOptions: () => [],
          matchEntity: () => true,
        },
      });
      const app = renderTestApp({
        features: [
          aiCatalogPlugin.withOverrides({ extensions: [page] }),
          createFrontendModule({
            pluginId: 'ai-catalog',
            extensions: [customFilter],
          }),
        ],
        config: {
          app: {
            extensions: disabledFilters.map(name => ({
              [`ai-catalog-filter:ai-catalog/${name}`]: false,
            })),
          },
        },
        initialRouteEntries: ['/ai-catalog'],
      });
      expect(await app.findByText(expected)).toBeInTheDocument();
    },
  );

  it('exports the translation module as the translations entrypoint default', () => {
    expect(aiCatalogTranslationsModule.$$type).toBe(
      '@backstage/FrontendModule',
    );
    expect(translationsModuleDefault).toBe(aiCatalogTranslationsModule);
    expect(aiCatalogTranslationsModule.pluginId).toBe('app');
    expect(aiCatalogTranslationRef.id).toBe('plugin.ai-catalog');
    expect(aiCatalogTranslations.id).toBe('plugin.ai-catalog');
    expect(publicExports.aiCatalogTranslationRef).toBe(aiCatalogTranslationRef);
  });
});

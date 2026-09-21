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

import type { Entity } from '@backstage/catalog-model';
import type { ExtensionDefinition } from '@backstage/frontend-plugin-api';
import { createExtensionTester } from '@backstage/frontend-test-utils';
import { EntityCardBlueprint } from '@backstage/plugin-catalog-react/alpha';

import { apiDocsPluginOverride } from '../api-docs/apiDocsPluginOverride';
import { catalogGraphPluginOverride } from '../catalog-graph/catalogGraphPluginOverride';
import { entityDependenciesGraphCardExtension } from '../catalog-graph/entityDependenciesGraphCardExtension';
import { entityOverviewGraphCardExtension } from '../catalog-graph/entityOverviewGraphCardExtension';
import {
  entityDependenciesApiDocsCardAttachments,
  entityDependenciesCatalogCardAttachments,
} from './entityDependenciesCardAttachments';
import { entityOverviewCatalogCardDefaults } from './entityOverviewCatalogCardDefaults';
import { entityPageLayoutExtensions } from './entityPageLayoutExtensions';
import { entityPageTabExtensions } from './entityPageTabExtensions';

const dependenciesTab = {
  id: 'entity-content:catalog/rhdh-component-dependencies',
  input: 'cards',
} as const;

const overviewCards = {
  id: 'entity-content:catalog/overview',
  input: 'cards',
} as const;

const componentEntity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: { name: 'demo' },
} as Entity;

const apiEntity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'API',
  metadata: { name: 'demo-api' },
} as Entity;

const extensionSpec = (ext: ExtensionDefinition) =>
  JSON.parse(JSON.stringify(ext)) as {
    kind: string;
    name?: string;
    attachTo: { id: string; input: string };
  };

const filterOf = (
  ext: ExtensionDefinition,
  config?: object,
): ((entity: Entity) => boolean) | undefined =>
  createExtensionTester(ext, config ? { config } : undefined).get(
    EntityCardBlueprint.dataRefs.filterFunction,
  ) as ((entity: Entity) => boolean) | undefined;

const typeOf = (ext: ExtensionDefinition): 'info' | 'content' | undefined =>
  createExtensionTester(ext).get(EntityCardBlueprint.dataRefs.type) as
    | 'info'
    | 'content'
    | undefined;

describe('entity page NFS defaults (integration)', () => {
  it('places overview info cards, dependency cards, layouts, and tabs', () => {
    const overviewInfo = entityOverviewCatalogCardDefaults.map(extensionSpec);
    expect(overviewInfo).toEqual([
      expect.objectContaining({
        kind: 'entity-card',
        name: 'about',
        attachTo: overviewCards,
      }),
      expect.objectContaining({
        kind: 'entity-card',
        name: 'links',
        attachTo: overviewCards,
      }),
    ]);
    expect(entityOverviewCatalogCardDefaults.map(ext => typeOf(ext))).toEqual([
      'info',
      'info',
    ]);

    for (const ext of [
      ...entityDependenciesCatalogCardAttachments,
      ...entityDependenciesApiDocsCardAttachments,
    ]) {
      expect(extensionSpec(ext).attachTo).toEqual(dependenciesTab);
    }

    expect(entityPageLayoutExtensions.map(extensionSpec)).toEqual([
      expect.objectContaining({
        kind: 'entity-content-layout',
        name: 'rhdh',
        attachTo: { id: 'entity-content:catalog/overview', input: 'layouts' },
      }),
      expect.objectContaining({
        kind: 'entity-content-layout',
        name: 'rhdh-component-dependencies',
        attachTo: {
          id: 'entity-content:catalog/rhdh-component-dependencies',
          input: 'layouts',
        },
      }),
    ]);

    expect(entityPageTabExtensions.map(extensionSpec)).toEqual([
      expect.objectContaining({
        kind: 'entity-content',
        name: 'rhdh-component-dependencies',
        attachTo: { id: 'page:catalog/entity', input: 'contents' },
      }),
      expect.objectContaining({
        kind: 'entity-content',
        name: 'rhdh-system-diagram',
        attachTo: { id: 'page:catalog/entity', input: 'contents' },
      }),
    ]);

    expect(extensionSpec(entityOverviewGraphCardExtension)).toEqual(
      expect.objectContaining({
        kind: 'entity-card',
        name: 'rhdh-overview-relations',
        attachTo: overviewCards,
      }),
    );
    expect(extensionSpec(entityDependenciesGraphCardExtension)).toEqual(
      expect.objectContaining({
        kind: 'entity-card',
        name: 'rhdh-component-dependencies-relations',
        attachTo: dependenciesTab,
      }),
    );
  });

  it('hides stock relations and definition cards unless useOriginalFactory is set', () => {
    const relationsCard = catalogGraphPluginOverride.getExtension(
      'entity-card:catalog-graph/relations',
    );
    expect(filterOf(relationsCard)?.(componentEntity)).toBe(false);
    expect(filterOf(relationsCard)?.(apiEntity)).toBe(false);

    // Stock factory has no always-false hide filter.
    expect(
      filterOf(relationsCard, { useOriginalFactory: true })?.(componentEntity),
    ).not.toBe(false);

    const definitionCard = apiDocsPluginOverride.getExtension(
      'entity-card:api-docs/definition',
    );
    expect(filterOf(definitionCard)?.(apiEntity)).toBe(false);
    expect(filterOf(definitionCard)?.(componentEntity)).toBe(false);

    expect(
      filterOf(definitionCard, { useOriginalFactory: true })?.(apiEntity),
    ).not.toBe(false);
  });
});

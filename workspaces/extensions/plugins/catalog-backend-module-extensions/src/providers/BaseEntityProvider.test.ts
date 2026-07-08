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

import { Entity } from '@backstage/catalog-model';
import {
  LoggerService,
  SchedulerServiceTaskRunner,
} from '@backstage/backend-plugin-api';
import { ExtensionsAnnotation } from '@red-hat-developer-hub/backstage-plugin-extensions-common';
import { BaseEntityProvider } from './BaseEntityProvider';
import { JsonFileData } from '../types';

class TestEntityProvider extends BaseEntityProvider<Entity> {
  getProviderName(): string {
    return 'test-entity-provider';
  }

  getKind(): string {
    return 'Plugin';
  }
}

const taskRunner: SchedulerServiceTaskRunner = {
  run: jest.fn(async ({ fn }) => fn(new AbortController().signal)),
};
const logger: LoggerService = {
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  child: jest.fn(),
};

const createEntity = (overrides?: Partial<Entity>): Entity => ({
  apiVersion: 'extensions.backstage.io/v1alpha1',
  kind: 'Plugin',
  metadata: {
    name: 'duplicate-plugin',
    ...overrides?.metadata,
  },
  spec: {
    owner: 'test-owner',
    ...(overrides?.spec as object),
  },
  ...overrides,
});

const createFileData = (
  filePath: string,
  entity: Entity,
): JsonFileData<Entity> => ({
  filePath,
  content: entity,
});

describe('BaseEntityProvider collision policy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('keeps first definition when duplicate entities are equivalent', () => {
    const provider = new TestEntityProvider(taskRunner, undefined, logger);
    const duplicate = createEntity();

    const entities = provider.getEntities([
      createFileData('/extensions/primary/plugin.yaml', duplicate),
      createFileData('/extensions/extra/community/plugin.yaml', duplicate),
    ]);

    expect(entities).toHaveLength(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        "Skipping duplicate Extensions entity 'plugin:default/duplicate-plugin'",
      ),
    );
  });

  it('warns and skips when duplicate entities have conflicting definitions', () => {
    const provider = new TestEntityProvider(taskRunner, undefined, logger);
    const firstEntity = createEntity({
      spec: { owner: 'owner-a' },
    });
    const secondEntity = createEntity({
      spec: { owner: 'owner-b' },
    });

    const entities = provider.getEntities([
      createFileData('/extensions/primary/plugin.yaml', firstEntity),
      createFileData('/extensions/extra/community/plugin.yaml', secondEntity),
    ]);

    expect(entities).toHaveLength(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        "Conflicting Extensions entities detected for 'plugin:default/duplicate-plugin'",
      ),
    );
  });

  it('keeps entities with same name when namespaces differ', () => {
    const provider = new TestEntityProvider(taskRunner, undefined, logger);
    const defaultNamespaceEntity = createEntity({
      metadata: { name: 'shared-name' },
    });
    const customNamespaceEntity = createEntity({
      metadata: { name: 'shared-name', namespace: 'community' },
    });

    const entities = provider.getEntities([
      createFileData(
        '/extensions/primary/plugin-default.yaml',
        defaultNamespaceEntity,
      ),
      createFileData(
        '/extensions/extra/community/plugin-custom.yaml',
        customNamespaceEntity,
      ),
    ]);

    expect(entities).toHaveLength(2);
  });
});

describe('BaseEntityProvider.deriveCatalogSource', () => {
  it('returns "primary" for paths in the main catalog-entities directory', () => {
    expect(
      BaseEntityProvider.deriveCatalogSource(
        '/extensions/catalog-entities/plugin.yaml',
      ),
    ).toBe('primary');
  });

  it('returns "primary" for paths without the extra/ segment', () => {
    expect(
      BaseEntityProvider.deriveCatalogSource('/extensions/plugins/foo.yaml'),
    ).toBe('primary');
  });

  it('returns the source name for paths under extra/<name>/', () => {
    expect(
      BaseEntityProvider.deriveCatalogSource(
        '/extensions/extra/community/catalog-entities/plugin.yaml',
      ),
    ).toBe('community');
  });

  it('returns the source name for a different extra source', () => {
    expect(
      BaseEntityProvider.deriveCatalogSource(
        '/extensions/extra/partner/catalog-entities/plugins/plugin.yaml',
      ),
    ).toBe('partner');
  });

  it('handles auto-derived subdirectory names with special characters', () => {
    // imageRefToSubdirectory replaces /:@ with _ so names like this are common
    expect(
      BaseEntityProvider.deriveCatalogSource(
        '/extensions/extra/quay.io_rhdh_index_1.10/catalog-entities/plugin.yaml',
      ),
    ).toBe('quay.io_rhdh_index_1.10');
  });

  it('handles deeply nested files within a source directory', () => {
    expect(
      BaseEntityProvider.deriveCatalogSource(
        '/extensions/extra/community/catalog-entities/nested/deep/plugin.yaml',
      ),
    ).toBe('community');
  });

  it('handles Windows-style backslash paths', () => {
    expect(
      BaseEntityProvider.deriveCatalogSource(
        'C:\\extensions\\extra\\community\\catalog-entities\\plugin.yaml',
      ),
    ).toBe('community');
  });
});

describe('BaseEntityProvider source metadata annotations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sets catalog-source to "primary" for entities from the main catalog root', () => {
    const provider = new TestEntityProvider(taskRunner, undefined, logger);
    const entity = createEntity({ metadata: { name: 'primary-plugin' } });

    const entities = provider.getEntities([
      createFileData('/extensions/catalog-entities/plugin.yaml', entity),
    ]);

    expect(entities).toHaveLength(1);
    expect(
      entities[0].metadata.annotations?.[ExtensionsAnnotation.CATALOG_SOURCE],
    ).toBe('primary');
  });

  it('sets catalog-source to the extra source name for entities under extra/<name>/', () => {
    const provider = new TestEntityProvider(taskRunner, undefined, logger);
    const entity = createEntity({ metadata: { name: 'community-plugin' } });

    const entities = provider.getEntities([
      createFileData(
        '/extensions/extra/community/catalog-entities/plugin.yaml',
        entity,
      ),
    ]);

    expect(entities).toHaveLength(1);
    expect(
      entities[0].metadata.annotations?.[ExtensionsAnnotation.CATALOG_SOURCE],
    ).toBe('community');
  });

  it('sets distinct source annotations when entities come from different sources', () => {
    const provider = new TestEntityProvider(taskRunner, undefined, logger);
    const primaryPlugin = createEntity({
      metadata: { name: 'plugin-a' },
    });
    const communityPlugin = createEntity({
      metadata: { name: 'plugin-b' },
    });

    const entities = provider.getEntities([
      createFileData(
        '/extensions/catalog-entities/plugin-a.yaml',
        primaryPlugin,
      ),
      createFileData(
        '/extensions/extra/community/catalog-entities/plugin-b.yaml',
        communityPlugin,
      ),
    ]);

    expect(entities).toHaveLength(2);
    const sourceA =
      entities[0].metadata.annotations?.[ExtensionsAnnotation.CATALOG_SOURCE];
    const sourceB =
      entities[1].metadata.annotations?.[ExtensionsAnnotation.CATALOG_SOURCE];
    expect(sourceA).toBe('primary');
    expect(sourceB).toBe('community');
  });

  it('preserves the winning entity source annotation on duplicate (first-wins)', () => {
    const provider = new TestEntityProvider(taskRunner, undefined, logger);
    const entity = createEntity({ metadata: { name: 'dup-plugin' } });

    const entities = provider.getEntities([
      createFileData(
        '/extensions/extra/community/catalog-entities/plugin.yaml',
        entity,
      ),
      createFileData('/extensions/catalog-entities/plugin.yaml', entity),
    ]);

    expect(entities).toHaveLength(1);
    // First-wins: the community entity was seen first
    expect(
      entities[0].metadata.annotations?.[ExtensionsAnnotation.CATALOG_SOURCE],
    ).toBe('community');
  });

  it('sets correct distinct sources when entities share name but differ by namespace', () => {
    const provider = new TestEntityProvider(taskRunner, undefined, logger);
    const primaryEntity = createEntity({
      metadata: { name: 'shared-name' },
    });
    const communityEntity = createEntity({
      metadata: { name: 'shared-name', namespace: 'community' },
    });

    const entities = provider.getEntities([
      createFileData('/extensions/catalog-entities/plugin.yaml', primaryEntity),
      createFileData(
        '/extensions/extra/community/catalog-entities/plugin.yaml',
        communityEntity,
      ),
    ]);

    expect(entities).toHaveLength(2);
    const sources = entities.map(
      e => e.metadata.annotations?.[ExtensionsAnnotation.CATALOG_SOURCE],
    );
    expect(sources).toContain('primary');
    expect(sources).toContain('community');
  });
});

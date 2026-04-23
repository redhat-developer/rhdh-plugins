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
import { SchedulerServiceTaskRunner } from '@backstage/backend-plugin-api';
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
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('keeps first definition when duplicate entities are equivalent', () => {
    const provider = new TestEntityProvider(taskRunner);
    const duplicate = createEntity();

    const entities = provider.getEntities([
      createFileData('/extensions/primary/plugin.yaml', duplicate),
      createFileData('/extensions/extra/community/plugin.yaml', duplicate),
    ]);

    expect(entities).toHaveLength(1);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        "Skipping duplicate Extensions entity 'plugin/default/duplicate-plugin'",
      ),
    );
  });

  it('throws when duplicate entities have conflicting definitions', () => {
    const provider = new TestEntityProvider(taskRunner);
    const firstEntity = createEntity({
      spec: { owner: 'owner-a' },
    });
    const secondEntity = createEntity({
      spec: { owner: 'owner-b' },
    });

    expect(() =>
      provider.getEntities([
        createFileData('/extensions/primary/plugin.yaml', firstEntity),
        createFileData('/extensions/extra/community/plugin.yaml', secondEntity),
      ]),
    ).toThrow(
      "Conflicting Extensions entities detected for 'plugin/default/duplicate-plugin'",
    );
  });

  it('keeps entities with same name when namespaces differ', () => {
    const provider = new TestEntityProvider(taskRunner);
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

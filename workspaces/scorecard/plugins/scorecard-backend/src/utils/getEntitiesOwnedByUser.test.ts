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

import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';
import type { BackstageCredentials } from '@backstage/backend-plugin-api';
import * as catalogModel from '@backstage/catalog-model';
import type { Entity } from '@backstage/catalog-model';
import { RELATION_OWNED_BY } from '@backstage/catalog-model';

jest.mock('@backstage/catalog-model', () => {
  const actual = jest.requireActual('@backstage/catalog-model');
  return {
    ...actual,
    stringifyEntityRef: jest.fn(actual.stringifyEntityRef),
    parseEntityRef: jest.fn(actual.parseEntityRef),
  };
});

import { getEntitiesOwnedByUser } from './getEntitiesOwnedByUser';
import { MockEntityBuilder } from '../../__fixtures__/mockEntityBuilder';

describe('getEntitiesOwnedByUser', () => {
  let mockedCatalog: ReturnType<typeof catalogServiceMock.mock>;
  let mockCredentials: BackstageCredentials;
  let userEntity: catalogModel.Entity;
  let userOwnedEntity: catalogModel.Entity;

  beforeEach(() => {
    mockedCatalog = catalogServiceMock.mock();
    mockCredentials = {} as BackstageCredentials;

    userEntity = new MockEntityBuilder()
      .withKind('User')
      .withMetadata({ name: 'test-user', namespace: 'default' })
      .build();
    userOwnedEntity = new MockEntityBuilder()
      .withMetadata({ name: 'user-component', namespace: 'default' })
      .withSpec({ owner: 'user:default/test-user' })
      .build();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should throw NotFoundError when user entity is not found', async () => {
    mockedCatalog.getEntityByRef.mockResolvedValue(undefined);

    await expect(
      getEntitiesOwnedByUser('user:default/test-user', {
        catalog: mockedCatalog,
        credentials: mockCredentials,
      }),
    ).rejects.toThrow('User entity not found in catalog');
  });

  describe('when user has no memberOf groups', () => {
    beforeEach(() => {
      mockedCatalog.getEntityByRef.mockResolvedValue(userEntity);
      mockedCatalog.getEntities.mockResolvedValue({
        items: [userOwnedEntity],
      });
    });

    it('should call stringifyEntityRef three times', async () => {
      await getEntitiesOwnedByUser('user:default/test-user', {
        catalog: mockedCatalog,
        credentials: mockCredentials,
      });

      expect(catalogModel.stringifyEntityRef).toHaveBeenCalledTimes(2);
      expect(catalogModel.stringifyEntityRef).toHaveBeenNthCalledWith(
        1,
        userEntity,
      );
      expect(catalogModel.stringifyEntityRef).toHaveBeenNthCalledWith(
        2,
        userOwnedEntity,
      );
    });

    it('should not parse memberOf entities', async () => {
      await getEntitiesOwnedByUser('user:default/test-user', {
        catalog: mockedCatalog,
        credentials: mockCredentials,
      });

      expect(catalogModel.parseEntityRef).not.toHaveBeenCalled();
    });

    it('should call getEntities with owned by user relation', async () => {
      await getEntitiesOwnedByUser('user:default/test-user', {
        catalog: mockedCatalog,
        credentials: mockCredentials,
      });

      expect(mockedCatalog.getEntities).toHaveBeenCalledTimes(1);
      expect(mockedCatalog.getEntities).toHaveBeenCalledWith(
        {
          filter: {
            [`relations.${RELATION_OWNED_BY}`]: 'user:default/test-user',
          },
        },
        { credentials: mockCredentials },
      );
    });

    it('should return entities owned by user only', async () => {
      mockedCatalog.getEntities.mockResolvedValue({ items: [userOwnedEntity] });

      const result = await getEntitiesOwnedByUser('user:default/test-user', {
        catalog: mockedCatalog,
        credentials: mockCredentials,
      });

      expect(result).toEqual(['component:default/user-component']);
    });

    it('should return empty array when user owns no entities', async () => {
      mockedCatalog.getEntities.mockResolvedValue({ items: [] });

      const result = await getEntitiesOwnedByUser('user:default/test-user', {
        catalog: mockedCatalog,
        credentials: mockCredentials,
      });

      expect(result).toEqual([]);
    });
  });

  describe('when user has memberOf groups', () => {
    let userEntityWithMemberOf: Entity;
    let groupOwnedEntity: Entity;

    beforeEach(() => {
      userEntityWithMemberOf = new MockEntityBuilder()
        .withKind('User')
        .withMetadata({ name: 'test-user', namespace: 'default' })
        .withSpec({ memberOf: ['group:default/developers'] })
        .build();
      groupOwnedEntity = new MockEntityBuilder()
        .withMetadata({ name: 'group-component', namespace: 'default' })
        .build();

      mockedCatalog.getEntityByRef.mockResolvedValue(userEntityWithMemberOf);
      mockedCatalog.getEntities
        .mockResolvedValueOnce({ items: [userOwnedEntity] })
        .mockResolvedValueOnce({ items: [groupOwnedEntity] });
    });

    it('should call stringifyEntityRef four times', async () => {
      await getEntitiesOwnedByUser('user:default/test-user', {
        catalog: mockedCatalog,
        credentials: mockCredentials,
      });

      expect(catalogModel.stringifyEntityRef).toHaveBeenCalledTimes(4);
      expect(catalogModel.stringifyEntityRef).toHaveBeenNthCalledWith(
        1,
        userEntityWithMemberOf,
      );
      expect(catalogModel.stringifyEntityRef).toHaveBeenNthCalledWith(2, {
        kind: 'group',
        name: 'developers',
        namespace: 'default',
      });
      expect(catalogModel.stringifyEntityRef).toHaveBeenNthCalledWith(
        3,
        userOwnedEntity,
      );
      expect(catalogModel.stringifyEntityRef).toHaveBeenNthCalledWith(
        4,
        groupOwnedEntity,
      );
    });

    it('should call parseEntityRef once', async () => {
      await getEntitiesOwnedByUser('user:default/test-user', {
        catalog: mockedCatalog,
        credentials: mockCredentials,
      });

      expect(catalogModel.parseEntityRef).toHaveBeenCalledTimes(1);
      expect(catalogModel.parseEntityRef).toHaveBeenCalledWith(
        'group:default/developers',
        { defaultKind: 'Group', defaultNamespace: 'default' },
      );
    });

    it('should call getEntities with owned by user relation', async () => {
      await getEntitiesOwnedByUser('user:default/test-user', {
        catalog: mockedCatalog,
        credentials: mockCredentials,
      });

      expect(mockedCatalog.getEntities).toHaveBeenCalledTimes(2);
      expect(mockedCatalog.getEntities).toHaveBeenNthCalledWith(
        1,
        {
          filter: {
            [`relations.${RELATION_OWNED_BY}`]: 'user:default/test-user',
          },
        },
        { credentials: mockCredentials },
      );
      expect(mockedCatalog.getEntities).toHaveBeenNthCalledWith(
        2,
        {
          filter: {
            [`relations.${RELATION_OWNED_BY}`]: 'group:default/developers',
          },
        },
        { credentials: mockCredentials },
      );
    });

    it('should return entities owned by user and groups', async () => {
      const result = await getEntitiesOwnedByUser('user:default/test-user', {
        catalog: mockedCatalog,
        credentials: mockCredentials,
      });

      expect(result).toEqual([
        'component:default/user-component',
        'component:default/group-component',
      ]);
    });

    it('should return empty array when user and groups owns no entities', async () => {
      mockedCatalog.getEntities.mockReset();
      mockedCatalog.getEntities
        .mockResolvedValueOnce({ items: [] })
        .mockResolvedValueOnce({ items: [] });

      const result = await getEntitiesOwnedByUser('user:default/test-user', {
        catalog: mockedCatalog,
        credentials: mockCredentials,
      });

      expect(result).toEqual([]);
      expect(mockedCatalog.getEntities).toHaveBeenCalledTimes(2);
    });
  });
});

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
import {
  RELATION_MEMBER_OF,
  RELATION_OWNED_BY,
} from '@backstage/catalog-model';

jest.mock('@backstage/catalog-model', () => {
  const actual = jest.requireActual('@backstage/catalog-model');
  return {
    ...actual,
    stringifyEntityRef: jest.fn(actual.stringifyEntityRef),
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
      .withMetadata({ name: 'test-user', namespace: 'development' })
      .build();
    userOwnedEntity = new MockEntityBuilder()
      .withMetadata({ name: 'user-component', namespace: 'development' })
      .build();
    mockedCatalog.queryEntities.mockResolvedValue({
      items: [
        {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'Component',
          metadata: { name: 'user-component', namespace: 'development' },
        },
      ],
      pageInfo: {
        nextCursor: undefined, // No next page
      },
      totalItems: 1,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should throw NotFoundError when user entity is not found', async () => {
    mockedCatalog.getEntityByRef.mockResolvedValue(undefined);

    await expect(
      getEntitiesOwnedByUser('user:development/test-user', {
        catalog: mockedCatalog,
        credentials: mockCredentials,
      }),
    ).rejects.toThrow('User entity not found in catalog');
  });

  describe('when user has no memberOf groups', () => {
    beforeEach(() => {
      mockedCatalog.getEntityByRef.mockResolvedValue(userEntity);
    });

    it('should call stringifyEntityRef once', async () => {
      await getEntitiesOwnedByUser('user:development/test-user', {
        catalog: mockedCatalog,
        credentials: mockCredentials,
      });

      expect(catalogModel.stringifyEntityRef).toHaveBeenCalledTimes(1);
      expect(catalogModel.stringifyEntityRef).toHaveBeenNthCalledWith(
        1,
        userOwnedEntity,
      );
    });

    it('should not access memberOf relations when user has no groups', async () => {
      await getEntitiesOwnedByUser('user:development/test-user', {
        catalog: mockedCatalog,
        credentials: mockCredentials,
      });

      expect(userEntity.relations).toBeUndefined();
    });

    it('should call queryEntities with owned by user relation', async () => {
      await getEntitiesOwnedByUser('user:development/test-user', {
        catalog: mockedCatalog,
        credentials: mockCredentials,
      });

      expect(mockedCatalog.queryEntities).toHaveBeenCalledTimes(1);
      expect(mockedCatalog.queryEntities).toHaveBeenCalledWith(
        {
          filter: {
            [`relations.${RELATION_OWNED_BY}`]: 'user:development/test-user',
          },
          fields: ['kind', 'metadata'],
          limit: 50,
        },
        { credentials: mockCredentials },
      );
    });

    it('should return entities owned by user only', async () => {
      const result = await getEntitiesOwnedByUser(
        'user:development/test-user',
        {
          catalog: mockedCatalog,
          credentials: mockCredentials,
        },
      );

      expect(result).toEqual(['component:development/user-component']);
    });

    it('should return empty array when user owns no entities', async () => {
      mockedCatalog.queryEntities.mockResolvedValue({
        items: [],
        pageInfo: { nextCursor: undefined },
        totalItems: 0,
      });

      const result = await getEntitiesOwnedByUser(
        'user:development/test-user',
        {
          catalog: mockedCatalog,
          credentials: mockCredentials,
        },
      );

      expect(result).toEqual([]);
    });

    it('should call queryEntities with cursor', async () => {
      mockedCatalog.queryEntities.mockReset();
      mockedCatalog.queryEntities
        .mockResolvedValueOnce({
          items: [userOwnedEntity],
          pageInfo: { nextCursor: 'cursor1' },
          totalItems: 1,
        })
        .mockResolvedValueOnce({
          items: [],
          pageInfo: { nextCursor: undefined },
          totalItems: 0,
        });

      await getEntitiesOwnedByUser('user:development/test-user', {
        catalog: mockedCatalog,
        credentials: mockCredentials,
      });

      expect(mockedCatalog.queryEntities).toHaveBeenCalledTimes(2);
      expect(mockedCatalog.queryEntities).toHaveBeenNthCalledWith(
        1,
        {
          filter: {
            [`relations.${RELATION_OWNED_BY}`]: 'user:development/test-user',
          },
          fields: ['kind', 'metadata'],
          limit: 50,
        },
        { credentials: mockCredentials },
      );
      expect(mockedCatalog.queryEntities).toHaveBeenNthCalledWith(
        2,
        {
          cursor: 'cursor1',
          filter: {
            [`relations.${RELATION_OWNED_BY}`]: 'user:development/test-user',
          },
          fields: ['kind', 'metadata'],
          limit: 50,
        },
        { credentials: mockCredentials },
      );
    });
  });

  describe('when user has memberOf groups', () => {
    let userEntityWithMemberOf: Entity;
    let groupOwnedEntity: Entity;

    beforeEach(() => {
      userEntityWithMemberOf = new MockEntityBuilder()
        .withKind('User')
        .withMetadata({ name: 'test-user', namespace: 'development' })
        .withRelations([
          {
            type: RELATION_MEMBER_OF,
            targetRef: 'group:development/developers',
          },
        ])
        .build();
      groupOwnedEntity = new MockEntityBuilder()
        .withMetadata({ name: 'group-component', namespace: 'development' })
        .build();

      mockedCatalog.getEntityByRef.mockResolvedValue(userEntityWithMemberOf);
      mockedCatalog.queryEntities
        .mockResolvedValueOnce({
          items: [userOwnedEntity],
          pageInfo: { nextCursor: undefined },
          totalItems: 1,
        })
        .mockResolvedValueOnce({
          items: [groupOwnedEntity],
          pageInfo: { nextCursor: undefined },
          totalItems: 1,
        });
    });

    it('should call stringifyEntityRef twice for owned entities', async () => {
      await getEntitiesOwnedByUser('user:development/test-user', {
        catalog: mockedCatalog,
        credentials: mockCredentials,
      });

      expect(catalogModel.stringifyEntityRef).toHaveBeenCalledTimes(2);
      expect(catalogModel.stringifyEntityRef).toHaveBeenNthCalledWith(
        1,
        userOwnedEntity,
      );
      expect(catalogModel.stringifyEntityRef).toHaveBeenNthCalledWith(
        2,
        groupOwnedEntity,
      );
    });

    it('should use relations to get group references', async () => {
      await getEntitiesOwnedByUser('user:development/test-user', {
        catalog: mockedCatalog,
        credentials: mockCredentials,
      });

      expect(userEntityWithMemberOf.relations).toHaveLength(1);
      expect(userEntityWithMemberOf.relations?.[0].type).toBe(
        RELATION_MEMBER_OF,
      );
      expect(userEntityWithMemberOf.relations?.[0].targetRef).toBe(
        'group:development/developers',
      );
    });

    it('should call queryEntities with owned by user relation', async () => {
      await getEntitiesOwnedByUser('user:development/test-user', {
        catalog: mockedCatalog,
        credentials: mockCredentials,
      });

      expect(mockedCatalog.queryEntities).toHaveBeenCalledTimes(2);
      expect(mockedCatalog.queryEntities).toHaveBeenNthCalledWith(
        1,
        {
          filter: {
            [`relations.${RELATION_OWNED_BY}`]: 'user:development/test-user',
          },
          fields: ['kind', 'metadata'],
          limit: 50,
        },
        { credentials: mockCredentials },
      );
      expect(mockedCatalog.queryEntities).toHaveBeenNthCalledWith(
        2,
        {
          filter: {
            [`relations.${RELATION_OWNED_BY}`]: 'group:development/developers',
          },
          fields: ['kind', 'metadata'],
          limit: 50,
        },
        { credentials: mockCredentials },
      );
    });

    it('should return entities owned by user and groups', async () => {
      const result = await getEntitiesOwnedByUser(
        'user:development/test-user',
        {
          catalog: mockedCatalog,
          credentials: mockCredentials,
        },
      );

      expect(result).toEqual([
        'component:development/user-component',
        'component:development/group-component',
      ]);
    });

    it('should return empty array when user and groups owns no entities', async () => {
      mockedCatalog.queryEntities.mockReset();
      mockedCatalog.queryEntities
        .mockResolvedValueOnce({
          items: [],
          pageInfo: { nextCursor: undefined },
          totalItems: 0,
        })
        .mockResolvedValueOnce({
          items: [],
          pageInfo: { nextCursor: undefined },
          totalItems: 0,
        });

      const result = await getEntitiesOwnedByUser(
        'user:development/test-user',
        {
          catalog: mockedCatalog,
          credentials: mockCredentials,
        },
      );

      expect(result).toEqual([]);
      expect(mockedCatalog.queryEntities).toHaveBeenCalledTimes(2);
    });
  });
});

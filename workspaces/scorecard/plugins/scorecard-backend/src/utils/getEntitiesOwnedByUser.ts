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

import { NotFoundError } from '@backstage/errors';
import { BackstageCredentials } from '@backstage/backend-plugin-api';
import { CatalogService } from '@backstage/plugin-catalog-node';
import {
  RELATION_MEMBER_OF,
  RELATION_OWNED_BY,
  stringifyEntityRef,
} from '@backstage/catalog-model';

const QUERY_ENTITIES_BATCH_SIZE = 50;

export async function getEntitiesOwnedByUser(
  userEntityRef: string,
  options: {
    catalog: CatalogService;
    credentials: BackstageCredentials;
  },
): Promise<string[]> {
  const userEntity = await options.catalog.getEntityByRef(userEntityRef, {
    credentials: options.credentials,
  });

  if (!userEntity) {
    throw new NotFoundError('User entity not found in catalog');
  }

  const ownerRefs: string[] = [userEntityRef];

  const memberOfRelations =
    userEntity.relations?.filter(
      relation => relation.type === RELATION_MEMBER_OF,
    ) ?? [];

  if (memberOfRelations.length > 0) {
    for (const relation of memberOfRelations) {
      ownerRefs.push(relation.targetRef);
    }
  }

  const entitiesOwnedByUserAndGroups: string[] = [];

  for (const ownerRef of ownerRefs) {
    let cursor: string | undefined = undefined;

    do {
      const entities = await options.catalog.queryEntities(
        {
          filter: {
            [`relations.${RELATION_OWNED_BY}`]: ownerRef,
          },
          fields: ['kind', 'metadata'],
          limit: QUERY_ENTITIES_BATCH_SIZE,
          ...(cursor ? { cursor } : {}),
        },
        { credentials: options.credentials },
      );

      cursor = entities.pageInfo.nextCursor;

      const entityRefs = entities.items.map(entity =>
        stringifyEntityRef(entity),
      );
      entitiesOwnedByUserAndGroups.push(...entityRefs);
    } while (cursor !== undefined);
  }

  return entitiesOwnedByUserAndGroups;
}

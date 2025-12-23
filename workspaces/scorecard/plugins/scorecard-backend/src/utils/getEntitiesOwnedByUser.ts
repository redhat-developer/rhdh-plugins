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
  parseEntityRef,
  RELATION_OWNED_BY,
  stringifyEntityRef,
} from '@backstage/catalog-model';

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

  const entitiesOwnedByUser: string[] = [stringifyEntityRef(userEntity)];

  const memberOf = userEntity.spec?.memberOf;
  if (Array.isArray(memberOf) && memberOf.length > 0) {
    for (const entityRef of memberOf) {
      if (typeof entityRef === 'string') {
        const parsedEntityRef = parseEntityRef(entityRef, {
          defaultKind: 'Group',
          defaultNamespace: userEntity.metadata.namespace,
        });

        entitiesOwnedByUser.push(stringifyEntityRef(parsedEntityRef));
      }
    }
  }

  const entitiesOwnedByUserAndGroups: string[] = [];

  for (const entityRef of entitiesOwnedByUser) {
    const entities = await options.catalog.getEntities(
      {
        filter: {
          [`relations.${RELATION_OWNED_BY}`]: entityRef,
        },
      },
      { credentials: options.credentials },
    );

    const entityRefs = entities.items.map(entity => stringifyEntityRef(entity));
    entitiesOwnedByUserAndGroups.push(...entityRefs);
  }

  return entitiesOwnedByUserAndGroups;
}

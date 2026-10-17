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

import {
  CatalogTable,
  CatalogTableColumnsFunc,
  CatalogTableRow,
} from '@backstage/plugin-catalog';

export const createCatalogTableColumnsFunc: CatalogTableColumnsFunc =
  entityListContext => [
    ...CatalogTable.defaultColumnsFunc(entityListContext),
    {
      title: 'Created At',
      customSort: (a: CatalogTableRow, b: CatalogTableRow) => {
        const timestampA =
          a.entity.metadata.annotations?.['backstage.io/createdAt'];
        const timestampB =
          b.entity.metadata.annotations?.['backstage.io/createdAt'];

        const dateA =
          timestampA && timestampA !== ''
            ? new Date(timestampA).toISOString()
            : '';
        const dateB =
          timestampB && timestampB !== ''
            ? new Date(timestampB).toISOString()
            : '';

        return dateA.localeCompare(dateB);
      },
      render: (data: CatalogTableRow) => {
        const date =
          data.entity.metadata.annotations?.['backstage.io/createdAt'];
        return !Number.isNaN(new Date(date || '').getTime())
          ? data.entity.metadata.annotations?.['backstage.io/createdAt']
          : '';
      },
    },
  ];

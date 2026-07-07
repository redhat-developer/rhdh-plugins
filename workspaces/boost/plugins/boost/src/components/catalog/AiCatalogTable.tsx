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

import { useMemo } from 'react';
import type { Entity } from '@backstage/catalog-model';
import {
  type ColumnConfig,
  type SortState,
  type TableItem,
  CellText,
  Table,
} from '@backstage/ui';

import { useTranslation } from '../../hooks/useTranslation';
import { getCategoryMeta } from '../../utils/categoryMeta';
import { entityHref, getSpecField } from '../../utils/entityHelpers';

interface AiAssetRow extends TableItem {
  title: string;
  categoryLabel: string;
  owner: string;
  provider: string;
  description: string;
  href: string;
}

function toRows(entities: Entity[]): AiAssetRow[] {
  return entities.map(entity => ({
    id: entity.metadata.uid ?? entity.metadata.name,
    title: entity.metadata.title ?? entity.metadata.name,
    categoryLabel: getCategoryMeta(getSpecField(entity, 'type')).label,
    owner: getSpecField(entity, 'owner') ?? '',
    provider: entity.metadata.annotations?.['rhdh.io/ai-asset-source'] ?? '',
    description: entity.metadata.description ?? '',
    href: entityHref(entity),
  }));
}

export interface AiCatalogTableProps {
  entities: Entity[];
  sort: SortState;
}

export const AiCatalogTable = ({ entities, sort }: AiCatalogTableProps) => {
  const { t } = useTranslation();
  const rows = useMemo(() => toRows(entities), [entities]);

  const columns: ColumnConfig<AiAssetRow>[] = useMemo(
    () => [
      {
        id: 'title',
        label: t('catalog.table.name'),
        cell: item => <CellText title={item.title} href={item.href} />,
        isRowHeader: true,
        isSortable: true,
      },
      {
        id: 'categoryLabel',
        label: t('catalog.table.type'),
        cell: item => <CellText title={item.categoryLabel} />,
        isSortable: true,
      },
      {
        id: 'owner',
        label: t('catalog.table.owner'),
        cell: item => <CellText title={item.owner} />,
        isSortable: true,
      },
      {
        id: 'provider',
        label: t('catalog.table.provider'),
        cell: item => <CellText title={item.provider} />,
      },
      {
        id: 'description',
        label: t('catalog.table.description'),
        cell: item => <CellText title={item.description} color="secondary" />,
      },
    ],
    [t],
  );

  return (
    <Table
      data={rows}
      columnConfig={columns}
      pagination={{ type: 'none' }}
      sort={sort}
      rowConfig={{ getHref: item => item.href }}
    />
  );
};

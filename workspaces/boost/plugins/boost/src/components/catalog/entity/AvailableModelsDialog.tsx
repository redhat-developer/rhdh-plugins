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
import {
  Button,
  CellText,
  Dialog,
  DialogBody,
  DialogHeader,
  DialogTrigger,
  SearchField,
  Table,
  Text,
  useTable,
  type ColumnConfig,
} from '@backstage/ui';

import { useTranslation } from '../../../hooks/useTranslation';

interface ModelRow {
  id: string;
  name: string;
}

interface AvailableModelsDialogProps {
  models: string[];
}

export const AvailableModelsDialog = ({
  models,
}: AvailableModelsDialogProps) => {
  const { t } = useTranslation();
  const rows = useMemo<ModelRow[]>(
    () => models.map(name => ({ id: name, name })),
    [models],
  );
  const columns = useMemo<readonly ColumnConfig<ModelRow>[]>(
    () => [
      {
        id: 'name',
        label: t('catalog.card.modelTitle'),
        isRowHeader: true,
        cell: row => <CellText title={row.name} />,
      },
    ],
    [t],
  );
  const { tableProps, search } = useTable({
    mode: 'complete',
    data: rows,
    searchFn: (data, searchTerm) => {
      const normalizedSearch = searchTerm.trim().toLowerCase();
      return normalizedSearch
        ? data.filter(row => row.name.toLowerCase().includes(normalizedSearch))
        : data;
    },
    paginationOptions: {
      type: 'page',
      pageSize: 20,
      pageSizeOptions: [20, 50, 100],
    },
  });

  return (
    <DialogTrigger>
      <Button variant="secondary" size="small">
        {t('catalog.card.viewModels')}
      </Button>
      <Dialog width="min(720px, calc(100vw - 32px))">
        <DialogHeader>
          {`${t('catalog.card.modelsDialogTitle')} (${models.length})`}
        </DialogHeader>
        <DialogBody>
          <SearchField
            aria-label={t('catalog.card.modelSearch')}
            placeholder={t('catalog.card.modelSearch')}
            value={search.value}
            onChange={search.onChange}
          />
          <Table
            {...tableProps}
            columnConfig={columns}
            emptyState={
              <Text color="secondary">{t('catalog.card.noModelsMatch')}</Text>
            }
          />
        </DialogBody>
      </Dialog>
    </DialogTrigger>
  );
};

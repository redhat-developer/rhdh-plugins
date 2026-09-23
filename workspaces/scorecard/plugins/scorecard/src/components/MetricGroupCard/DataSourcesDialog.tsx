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

import { useCallback, useEffect, useMemo, useState } from 'react';

import { ResponseErrorPanel } from '@backstage/core-components';
import type { SortDescriptor } from '@backstage/ui';
import {
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  Table,
  useTable,
  Button,
} from '@backstage/ui';
import Box from '@mui/material/Box';

import { useTranslation } from '../../hooks/useTranslation';
import { CardLoading } from '../Common/CardLoading';
import {
  buildColumnConfig,
  sortSourceRows,
  type SourceRow,
} from './DataSourcesDialogColumns';
import { ThresholdLegend } from './ThresholdLegend';
import type { ThresholdBucket } from './types';

export type { SourceRow };

export interface DataSourcesDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  rows: SourceRow[];
  isLoading?: boolean;
  error?: Error;
  initialFilters?: string[];
  /** When provided, the footer renders a filterable threshold legend. */
  buckets?: ThresholdBucket[];
}

/** Scopes dialog style overrides to this instance (set on BUI ModalOverlay). */
const DATA_SOURCES_DIALOG_ATTR = 'data-scorecard-data-sources-dialog';

export const DataSourcesDialog = ({
  open,
  onClose,
  title,
  rows,
  isLoading = false,
  error,
  initialFilters,
  buckets,
}: DataSourcesDialogProps) => {
  const { t } = useTranslation();

  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor | null>(
    null,
  );

  useEffect(() => {
    if (open) {
      setActiveFilters(new Set(initialFilters ?? []));
      setSortDescriptor(null);
    }
  }, [open, initialFilters]);

  const handleToggleFilter = useCallback((key: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const filteredRows = useMemo(
    () =>
      activeFilters.size > 0
        ? rows.filter(r => activeFilters.has(r.evaluationKey))
        : rows,
    [rows, activeFilters],
  );

  const columnConfig = useMemo(() => buildColumnConfig(t), [t]);

  const { tableProps } = useTable({
    mode: 'complete',
    data: filteredRows,
    paginationOptions: { type: 'none' },
    sort: sortDescriptor,
    onSortChange: setSortDescriptor,
    sortFn: sortSourceRows,
  });

  const renderBody = () => {
    if (isLoading) {
      return <CardLoading dataTestId="data-sources-loading" />;
    }
    if (error) {
      return <ResponseErrorPanel error={error} />;
    }
    return (
      <Box>
        <Table columnConfig={columnConfig} {...tableProps} />
      </Box>
    );
  };

  return (
    <Dialog
      isOpen={open}
      onOpenChange={isOpen => !isOpen && onClose()}
      width={900}
      {...{ [DATA_SOURCES_DIALOG_ATTR]: '' }}
    >
      <DialogHeader style={{ padding: '1rem 1.5rem' }}>
        {t('dataSourcesDialog.title', { title } as any)}
      </DialogHeader>
      <DialogBody style={{ paddingTop: '0' }}>{renderBody()}</DialogBody>
      <DialogFooter
        style={{
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        {buckets && (
          <ThresholdLegend
            buckets={buckets}
            activeFilters={activeFilters}
            onToggleFilter={handleToggleFilter}
          />
        )}
        <Button
          variant="primary"
          onPress={onClose}
          style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            padding: '0.375rem 1rem',
            maxWidth: '5rem',
            marginLeft: 'auto',
          }}
        >
          {t('dataSourcesDialog.close')}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

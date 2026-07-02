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

import type { MetricResult } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import type { SortDescriptor } from '@backstage/ui';
import {
  Cell,
  CellText,
  ColumnConfig,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  Flex,
  Table,
  TableItem,
  Text,
  useTable,
  Button,
  Column,
} from '@backstage/ui';
import Box from '@mui/material/Box';
import MuiTooltip from '@mui/material/Tooltip';

import { useTranslation } from '../../hooks/useTranslation';
import { useLanguage } from '../../hooks/useLanguage';
import {
  getStatusConfig,
  getTranslatedStatus,
  getLastUpdatedLabel,
  extractPluginName,
  resolveMetricTranslation,
} from '../../utils';
import { buildThresholdBuckets } from './thresholdBucketUtils';
import { StatusIcon } from './StatusIcon';
import { ThresholdLegend } from './ThresholdLegend';

interface DataSourcesDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  metrics: MetricResult[];
  initialFilters?: string[];
}

interface SourceRow extends TableItem {
  plugin: string;
  checkTitle: string;
  checkDescription: string;
  value: string;
  evaluationKey: string | null;
  statusLabel: string;
  statusIcon: string;
  statusColor: string;
  lastSynced: string;
  thresholdExpression: string | null;
}

export const DataSourcesDialog = ({
  open,
  onClose,
  title,
  metrics,
  initialFilters,
}: DataSourcesDialogProps) => {
  const { t } = useTranslation();
  const locale = useLanguage();

  const buckets = useMemo(
    () => buildThresholdBuckets(metrics, t),
    [metrics, t],
  );

  const rows = useMemo<SourceRow[]>(
    () =>
      metrics.map((metric, index) => {
        const evaluationKey =
          metric.result?.thresholdResult?.evaluation ?? null;

        const thresholdRules =
          metric.result?.thresholdResult?.definition?.rules;

        const statusConfig = getStatusConfig({
          evaluation: evaluationKey,
          thresholdStatus: metric.result?.thresholdResult?.status,
          metricStatus: metric.status,
          thresholdRules,
        });

        const matchedRule = evaluationKey
          ? thresholdRules?.find(r => r.key === evaluationKey)
          : undefined;

        return {
          id: String(index),
          plugin: extractPluginName(
            metric.id,
            t('dataSourcesDialog.unknownPlugin'),
          ),
          checkTitle: metric.id,
          checkDescription: resolveMetricTranslation(
            t,
            metric.id,
            'description',
            metric.metadata.description,
          ),
          value:
            metric.result?.value !== null && metric.result?.value !== undefined
              ? String(metric.result.value)
              : '—',
          evaluationKey,
          statusLabel: evaluationKey
            ? getTranslatedStatus(evaluationKey, t)
            : '—',
          statusIcon: statusConfig.icon ?? '',
          statusColor: statusConfig.color,
          lastSynced: metric.result?.timestamp
            ? getLastUpdatedLabel(metric.result.timestamp, locale)
            : '—',
          thresholdExpression: matchedRule?.expression ?? null,
        };
      }),
    [metrics, t, locale],
  );

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
        ? rows.filter(
            r => r.evaluationKey !== null && activeFilters.has(r.evaluationKey),
          )
        : rows,
    [rows, activeFilters],
  );

  /**
   * Renders the column configuration for the table.
   * @returns The column configuration for the table.
   */
  const columnConfig = useMemo<ColumnConfig<SourceRow>[]>(() => {
    const headerStyle = {
      fontSize: '0.875rem',
      fontWeight: 700,
      cursor: 'pointer',
    } as const;

    const renderHeader =
      (
        id: string,
        label: string,
        opts?: {
          isRowHeader?: boolean;
          width?: ColumnConfig<SourceRow>['width'];
        },
      ) =>
      () =>
        (
          <Column
            id={id}
            allowsSorting
            isRowHeader={opts?.isRowHeader}
            width={opts?.width}
          >
            <Text
              variant="body-large"
              weight="bold"
              color="secondary"
              style={headerStyle}
            >
              {label}
            </Text>
          </Column>
        );

    return [
      {
        id: 'plugin',
        label: t('dataSourcesDialog.columns.plugin'),
        header: renderHeader('plugin', t('dataSourcesDialog.columns.plugin'), {
          width: '1fr' as ColumnConfig<SourceRow>['width'],
        }),
        cell: item => <CellText title={item.plugin} />,
        isSortable: true,
        width: '1fr' as ColumnConfig<SourceRow>['width'],
      },
      {
        id: 'check',
        label: t('dataSourcesDialog.columns.check'),
        header: renderHeader('check', t('dataSourcesDialog.columns.check'), {
          isRowHeader: true,
          width: '2.5fr' as ColumnConfig<SourceRow>['width'],
        }),
        cell: item => (
          <Cell style={{ padding: '1.5rem 0.75rem' }}>
            <Flex direction="column" gap="0.5">
              <Text variant="body-medium" style={{ fontWeight: 400 }}>
                {item.checkTitle}
              </Text>
              <Text
                variant="body-small"
                color="secondary"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {item.checkDescription}
              </Text>
            </Flex>
          </Cell>
        ),
        isSortable: true,
        isRowHeader: true,
        width: '2.5fr' as ColumnConfig<SourceRow>['width'],
      },
      {
        id: 'value',
        label: t('dataSourcesDialog.columns.value'),
        header: renderHeader('value', t('dataSourcesDialog.columns.value'), {
          width: '0.7fr' as ColumnConfig<SourceRow>['width'],
        }),
        cell: item => <CellText title={item.value} />,
        isSortable: true,
        width: '0.7fr' as ColumnConfig<SourceRow>['width'],
      },
      {
        id: 'status',
        label: t('dataSourcesDialog.columns.status'),
        header: renderHeader('status', t('dataSourcesDialog.columns.status'), {
          width: '1fr' as ColumnConfig<SourceRow>['width'],
        }),
        cell: item => {
          const tooltipText =
            item.thresholdExpression && item.evaluationKey
              ? t('dataSourcesDialog.statusTooltip', {
                  value: item.value,
                  status: item.statusLabel,
                  expression: item.thresholdExpression,
                } as any)
              : '';
          return (
            <Cell>
              <MuiTooltip title={tooltipText} placement="bottom" arrow>
                <Flex gap="1.5" style={{ alignItems: 'center' }}>
                  <StatusIcon icon={item.statusIcon} color={item.statusColor} />
                  <Text
                    variant="body-medium"
                    weight="bold"
                    style={{ fontWeight: 500, fontSize: '1rem' }}
                  >
                    {item.statusLabel}
                  </Text>
                </Flex>
              </MuiTooltip>
            </Cell>
          );
        },
        isSortable: true,
        width: '1fr' as ColumnConfig<SourceRow>['width'],
      },
      {
        id: 'lastSynced',
        label: t('dataSourcesDialog.columns.lastSynced'),
        header: renderHeader(
          'lastSynced',
          t('dataSourcesDialog.columns.lastSynced'),
          { width: '1.2fr' as ColumnConfig<SourceRow>['width'] },
        ),
        cell: item => <CellText title={item.lastSynced} />,
        isSortable: true,
        width: '1.2fr' as ColumnConfig<SourceRow>['width'],
      },
    ];
  }, [t]);

  const { tableProps } = useTable({
    mode: 'complete',
    data: filteredRows,
    paginationOptions: { type: 'none' },
    sort: sortDescriptor,
    onSortChange: setSortDescriptor,
    sortFn: (data, sort) => {
      const colToField: Record<string, keyof SourceRow> = {
        plugin: 'plugin',
        check: 'checkTitle',
        value: 'value',
        status: 'statusLabel',
        lastSynced: 'lastSynced',
      };
      const field = colToField[sort.column as string] ?? 'plugin';
      const sorted = [...data];
      const dir = sort.direction === 'ascending' ? 1 : -1;
      sorted.sort((a, b) => {
        if (field === 'value') {
          const numA = parseFloat(a.value);
          const numB = parseFloat(b.value);
          const aIsNum = !Number.isNaN(numA);
          const bIsNum = !Number.isNaN(numB);
          if (aIsNum && bIsNum) return dir * (numA - numB);
          if (aIsNum) return -dir;
          if (bIsNum) return dir;
          return 0;
        }
        const valA = String(a[field] ?? '');
        const valB = String(b[field] ?? '');
        return dir * valA.localeCompare(valB);
      });
      return sorted;
    },
  });

  const handleOverlayClick = useCallback(
    (e: MouseEvent) => {
      const dialog = document.querySelector('[role="dialog"]');
      if (dialog && !dialog.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return undefined;
    document.addEventListener('mousedown', handleOverlayClick);
    return () => document.removeEventListener('mousedown', handleOverlayClick);
  }, [open, handleOverlayClick]);

  return (
    <>
      {open && (
        <style>{`
          [class*="DialogOverlay"] {
            background: rgba(0, 0, 0, 0.5);
          }
          
          [slot="title"] {
            font-size: 1.25rem;
            font-weight: 700;
          }

          [slot="close"] svg {
            width: 1.5rem;
            height: 1.5rem;
          }
        `}</style>
      )}
      <Dialog
        isOpen={open}
        onOpenChange={isOpen => !isOpen && onClose()}
        width={900}
      >
        <DialogHeader style={{ padding: '1rem 1.5rem' }}>
          {t('dataSourcesDialog.title', { title } as any)}
        </DialogHeader>
        <DialogBody style={{ paddingTop: '0' }}>
          <Box
            sx={{
              '& tbody tr': {
                borderBottom: 'none !important',
              },
              '& tbody tr:nth-of-type(even)': {
                backgroundColor: 'action.hover',
              },
              '& tbody tr:nth-of-type(odd)': {
                backgroundColor: 'background.paper',
              },
            }}
          >
            <Table columnConfig={columnConfig} {...tableProps} />
          </Box>
        </DialogBody>
        <DialogFooter style={{ justifyContent: 'space-between' }}>
          <ThresholdLegend
            buckets={buckets}
            activeFilters={activeFilters}
            onToggleFilter={handleToggleFilter}
          />
          <Button
            variant="primary"
            onPress={onClose}
            style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              padding: '0.375rem 1rem',
              maxWidth: '5rem',
            }}
          >
            {t('dataSourcesDialog.close')}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
};

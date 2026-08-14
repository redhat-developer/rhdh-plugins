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

import type { MetricResult } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import type { SortDescriptor } from '@backstage/ui';
import {
  Cell,
  CellText,
  Column,
  ColumnConfig,
  Flex,
  TableItem,
  Text,
} from '@backstage/ui';
import MuiTooltip from '@mui/material/Tooltip';

import { useTranslation } from '../../hooks/useTranslation';
import { formatWithMetricUnit } from '../../utils';
import { MISSING_EVALUATION_LABEL } from './thresholdBucketUtils';
import { StatusIcon } from './StatusIcon';

export interface SourceRow extends TableItem {
  plugin: string;
  metricId: string;
  metricDescription: string;
  value: string;
  evaluationKey: string;
  statusLabel: string;
  statusIcon: string;
  statusColor: string;
  lastSynced: string;
  thresholdExpression: string | null;
  unit?: string;
}

const HEADER_STYLE = {
  fontSize: '0.875rem',
  fontWeight: 700,
  cursor: 'pointer',
} as const;

const METRIC_DESCRIPTION_STYLE = {
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
} as const;

const COL_TO_FIELD: Record<string, keyof SourceRow> = {
  plugin: 'plugin',
  check: 'metricId',
  value: 'value',
  status: 'statusLabel',
  lastSynced: 'lastSynced',
};

export function formatMetricValue(
  value: MetricResult['result'] | undefined,
): string {
  if (value?.value === null || value?.value === undefined) {
    return MISSING_EVALUATION_LABEL;
  }
  return String(value.value);
}

interface SortableColumnHeaderProps {
  id: string;
  label: string;
  isRowHeader?: boolean;
  width?: ColumnConfig<SourceRow>['width'];
}

const SortableColumnHeader = ({
  id,
  label,
  isRowHeader,
  width,
}: SortableColumnHeaderProps) => (
  <Column id={id} allowsSorting isRowHeader={isRowHeader} width={width}>
    <Text
      variant="body-large"
      weight="bold"
      color="secondary"
      style={HEADER_STYLE}
    >
      {label}
    </Text>
  </Column>
);

const CheckCell = ({ item }: { item: SourceRow }) => (
  <Cell style={{ padding: '1.5rem 0.75rem' }}>
    <Flex direction="column" gap="0.5">
      <Text variant="body-medium" style={{ fontWeight: 400 }}>
        {item.metricId}
      </Text>
      <Text
        variant="body-small"
        color="secondary"
        style={METRIC_DESCRIPTION_STYLE}
      >
        {item.metricDescription}
      </Text>
    </Flex>
  </Cell>
);

const StatusCell = ({
  item,
  tooltipText,
}: {
  item: SourceRow;
  tooltipText: string;
}) => (
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

export function sortSourceRows(
  data: SourceRow[],
  sort: SortDescriptor,
): SourceRow[] {
  const field = COL_TO_FIELD[sort.column as string] ?? 'plugin';
  const sorted = [...data];
  const dir = sort.direction === 'ascending' ? 1 : -1;

  sorted.sort((a, b) => {
    if (field === 'value') {
      const numA = Number.parseFloat(a.value);
      const numB = Number.parseFloat(b.value);
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
}

export function buildColumnConfig(
  t: ReturnType<typeof useTranslation>['t'],
): ColumnConfig<SourceRow>[] {
  return [
    {
      id: 'plugin',
      label: t('dataSourcesDialog.columns.plugin'),
      header: () => (
        <SortableColumnHeader
          id="plugin"
          label={t('dataSourcesDialog.columns.plugin')}
          width={'1fr' as ColumnConfig<SourceRow>['width']}
        />
      ),
      cell: item => <CellText title={item.plugin} />,
      isSortable: true,
      width: '1fr' as ColumnConfig<SourceRow>['width'],
    },
    {
      id: 'check',
      label: t('dataSourcesDialog.columns.check'),
      header: () => (
        <SortableColumnHeader
          id="check"
          label={t('dataSourcesDialog.columns.check')}
          isRowHeader
          width={'2.5fr' as ColumnConfig<SourceRow>['width']}
        />
      ),
      cell: item => <CheckCell item={item} />,
      isSortable: true,
      isRowHeader: true,
      width: '2.5fr' as ColumnConfig<SourceRow>['width'],
    },
    {
      id: 'value',
      label: t('dataSourcesDialog.columns.value'),
      header: () => (
        <SortableColumnHeader
          id="value"
          label={t('dataSourcesDialog.columns.value')}
          width={'0.7fr' as ColumnConfig<SourceRow>['width']}
        />
      ),
      cell: item => <CellText title={item.value} />,
      isSortable: true,
      width: '0.7fr' as ColumnConfig<SourceRow>['width'],
    },
    {
      id: 'status',
      label: t('dataSourcesDialog.columns.status'),
      header: () => (
        <SortableColumnHeader
          id="status"
          label={t('dataSourcesDialog.columns.status')}
          width={'1fr' as ColumnConfig<SourceRow>['width']}
        />
      ),
      cell: item => {
        const tooltipText =
          item.thresholdExpression && item.evaluationKey
            ? t('dataSourcesDialog.statusTooltip', {
                value: item.value,
                status: item.statusLabel,
                expression: formatWithMetricUnit(
                  item.thresholdExpression,
                  item.unit,
                ),
              } as any)
            : '';
        return <StatusCell item={item} tooltipText={tooltipText} />;
      },
      isSortable: true,
      width: '1fr' as ColumnConfig<SourceRow>['width'],
    },
    {
      id: 'lastSynced',
      label: t('dataSourcesDialog.columns.lastSynced'),
      header: () => (
        <SortableColumnHeader
          id="lastSynced"
          label={t('dataSourcesDialog.columns.lastSynced')}
          width={'1.2fr' as ColumnConfig<SourceRow>['width']}
        />
      ),
      cell: item => <CellText title={item.lastSynced} />,
      isSortable: true,
      width: '1.2fr' as ColumnConfig<SourceRow>['width'],
    },
  ];
}

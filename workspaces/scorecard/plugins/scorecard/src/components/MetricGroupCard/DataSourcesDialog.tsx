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
import { useLanguage } from '../../hooks/useLanguage';
import {
  getStatusConfig,
  getLastUpdatedLabel,
  extractPluginName,
  resolveMetricTranslation,
} from '../../utils';
import {
  buildThresholdBuckets,
  getMetricBucketKey,
  getMetricBucketLabel,
  hasMetricEvaluation,
  MISSING_EVALUATION_LABEL,
} from './thresholdBucketUtils';
import {
  buildColumnConfig,
  formatMetricValue,
  sortSourceRows,
  type SourceRow,
} from './DataSourcesDialogColumns';
import { ThresholdLegend } from './ThresholdLegend';

interface DataSourcesDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  metrics: MetricResult[];
  initialFilters?: string[];
}

/** Scopes dialog style overrides to this instance (set on BUI ModalOverlay). */
const DATA_SOURCES_DIALOG_ATTR = 'data-scorecard-data-sources-dialog';

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
        const evaluationKey = getMetricBucketKey(metric);
        const evaluated = hasMetricEvaluation(metric);
        const thresholdRules =
          metric.result?.thresholdResult?.definition?.rules ?? [];

        const statusConfig = getStatusConfig({
          evaluation: evaluated ? evaluationKey : null,
          thresholdStatus: metric.result?.thresholdResult?.status,
          metricStatus: metric.status,
          thresholdRules,
        });

        const matchedRule = evaluated
          ? thresholdRules.find(r => r.key === evaluationKey)
          : undefined;

        return {
          id: String(index),
          plugin: extractPluginName(
            metric.id,
            t('dataSourcesDialog.unknownPlugin'),
          ),
          metricId: metric.id,
          metricDescription: resolveMetricTranslation(
            t,
            metric.id,
            'description',
            metric.metadata.description,
          ),
          value: formatMetricValue(metric.result),
          evaluationKey,
          statusLabel: getMetricBucketLabel(evaluationKey, t),
          statusIcon: evaluated ? statusConfig.icon ?? '' : '',
          statusColor: statusConfig.color,
          lastSynced: metric.result?.timestamp
            ? getLastUpdatedLabel(metric.result.timestamp, locale)
            : MISSING_EVALUATION_LABEL,
          thresholdExpression: matchedRule?.expression ?? null,
          unit: metric.metadata.unit,
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

  return (
    <>
      <Dialog
        isOpen={open}
        onOpenChange={isOpen => !isOpen && onClose()}
        width={900}
        {...{ [DATA_SOURCES_DIALOG_ATTR]: '' }}
      >
        <DialogHeader style={{ padding: '1rem 1.5rem' }}>
          {t('dataSourcesDialog.title', { title } as any)}
        </DialogHeader>
        <DialogBody style={{ paddingTop: '0' }}>
          <Box>
            <Table columnConfig={columnConfig} {...tableProps} />
          </Box>
        </DialogBody>
        <DialogFooter
          style={{
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
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

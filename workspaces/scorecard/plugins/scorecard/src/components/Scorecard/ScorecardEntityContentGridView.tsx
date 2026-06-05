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

import { MetricResult } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { ResponseErrorPanel } from '@backstage/core-components';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useTheme } from '@mui/material/styles';

import { ScorecardLayoutProps } from '../../alpha/blueprints/ScorecardLayoutBlueprint';
import { useScorecards } from '../../hooks/useScorecards';
import NoScorecardsState from '../Common/NoScorecardsState';
import PermissionRequiredState from '../Common/PermissionRequiredState';
import { CardLoading } from '../Common/CardLoading';
import { EntityScorecardContent } from './EntityScorecardContent';
import Scorecard from './Scorecard';
import {
  getStatusConfig,
  resolveStatusColor,
  resolveMetricTranslation,
} from '../../utils';
import { useTranslation } from '../../hooks/useTranslation';

const statusTileBg: Record<string, string> = {
  success: '#e8f5e9',
  warning: '#fff3e0',
  error: '#fce4ec',
};

const statusTileText: Record<string, string> = {
  success: '#2e7d32',
  warning: '#e65100',
  error: '#c62828',
};

function getEvaluation(metric: MetricResult): string {
  return metric.result?.thresholdResult?.evaluation ?? 'error';
}

function MetricTile({
  metric,
  label,
}: {
  metric: MetricResult;
  label: string;
}) {
  const theme = useTheme();
  const evaluation = getEvaluation(metric);
  const hasError = metric.status === 'error' || metric.result?.value === null;

  const statusConfig = getStatusConfig({
    evaluation: metric.result?.thresholdResult?.evaluation,
    thresholdStatus: metric.result?.thresholdResult?.status,
    metricStatus: metric.status,
    thresholdRules: metric.result?.thresholdResult?.definition?.rules,
  });

  const resolvedColor = resolveStatusColor(theme, statusConfig.color);
  const bg = hasError
    ? '#fce4ec'
    : statusTileBg[evaluation] ?? `${resolvedColor}18`;
  const textColor = hasError
    ? '#c62828'
    : statusTileText[evaluation] ?? resolvedColor;

  const displayValue = hasError ? '—' : metric.result?.value ?? '—';

  return (
    <Box
      sx={{
        py: 1.5,
        px: 2,
        borderRadius: 2,
        backgroundColor: bg,
        textAlign: 'center',
        minWidth: 0,
      }}
    >
      <Typography
        variant="h6"
        sx={{ fontWeight: 700, color: textColor, lineHeight: 1.3 }}
      >
        {String(displayValue)}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: textColor,
          fontWeight: 500,
          display: 'block',
          lineHeight: 1.3,
          mt: 0.25,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function GroupCard({
  title,
  description,
  metrics,
}: {
  title: string;
  description?: string;
  metrics: MetricResult[];
}) {
  const metricCount = metrics.length;

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <CardContent sx={{ '&:last-child': { pb: 2 } }}>
        <Box
          display="flex"
          alignItems="flex-start"
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            {metricCount > 0 && (
              <Typography
                variant="body2"
                sx={{ color: 'warning.main', fontWeight: 600 }}
              >
                {metricCount} {metricCount === 1 ? 'metric' : 'metrics'}
              </Typography>
            )}
          </Box>
          <Box>
            <Tooltip title={description || title}>
              <IconButton size="small">
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <IconButton size="small">
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {description}
          </Typography>
        )}

        {metrics.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No metric data available yet
          </Typography>
        ) : (
          <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={1}>
            {metrics.map(metric => (
              <MetricTile
                key={metric.id}
                metric={metric}
                label={metric.metadata.title}
              />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export const ScorecardEntityContentGridView = ({
  groups,
}: ScorecardLayoutProps) => {
  const { data: scorecards, isLoading, error } = useScorecards();
  const { t } = useTranslation();

  if (isLoading) return <CardLoading />;

  if (error) {
    if (error.message?.includes('NotAllowedError')) {
      return <PermissionRequiredState />;
    }
    return <ResponseErrorPanel error={error} />;
  }

  if (!scorecards || scorecards.length === 0) return <NoScorecardsState />;

  if (!groups || Object.keys(groups).length === 0) {
    return <EntityScorecardContent />;
  }

  const groupedMetrics = new Map<string, MetricResult[]>();
  const ungroupedMetrics: MetricResult[] = [];

  scorecards.forEach(metric => {
    let wasGrouped = false;
    Object.entries(groups).forEach(([groupKey, groupConfig]) => {
      if (groupConfig.metrics.includes(metric.id)) {
        if (!groupedMetrics.has(groupKey)) {
          groupedMetrics.set(groupKey, []);
        }
        groupedMetrics.get(groupKey)!.push(metric);
        wasGrouped = true;
      }
    });
    if (!wasGrouped) ungroupedMetrics.push(metric);
  });

  return (
    <Box
      display="grid"
      gridTemplateColumns="repeat(auto-fill, minmax(340px, 1fr))"
      gap={2.5}
    >
      {/* show groups if they are configured for entity tab */}
      {false &&
        Object.entries(groups).map(([groupKey, groupConfig]) => {
          const metricsInGroup = groupedMetrics.get(groupKey) || [];

          const metricsWithLabels = metricsInGroup.map(m => ({
            ...m,
            metadata: {
              ...m.metadata,
              title: resolveMetricTranslation(
                t,
                m.id,
                'title',
                m.metadata.title,
              ),
            },
          }));

          return (
            <GroupCard
              key={groupKey}
              title={groupConfig.title}
              description={groupConfig.description}
              metrics={metricsWithLabels}
            />
          );
        })}

      {scorecards.length > 0 &&
        scorecards.map((metric: MetricResult) => {
          const isMetricDataError =
            metric.status === 'error' || metric.result?.value === null;
          const isThresholdError =
            metric.result?.thresholdResult?.status === 'error';
          const statusConfig = getStatusConfig({
            evaluation: metric.result?.thresholdResult?.evaluation,
            thresholdStatus: metric.result?.thresholdResult?.status,
            metricStatus: metric.status,
            thresholdRules: metric.result?.thresholdResult?.definition?.rules,
          });

          return (
            <Scorecard
              key={metric.id}
              cardTitle={resolveMetricTranslation(
                t,
                metric.id,
                'title',
                metric.metadata.title,
              )}
              description={resolveMetricTranslation(
                t,
                metric.id,
                'description',
                metric.metadata.description,
              )}
              statusColor={statusConfig.color}
              statusIcon={statusConfig.icon ?? ''}
              value={metric.result?.value}
              metricType={metric.metadata.type}
              thresholds={metric.result?.thresholdResult}
              isMetricDataError={isMetricDataError}
              metricDataError={metric?.error}
              isThresholdError={isThresholdError}
              thresholdError={metric.result?.thresholdResult?.error}
            />
          );
        })}
    </Box>
  );
};

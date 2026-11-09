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
import { useState } from 'react';
import millify from 'millify';
import { BarChart } from '@mui/x-charts/BarChart';
import { DEFAULT_X_AXIS_KEY } from '@mui/x-charts/constants';
import { Box, IconButton, Typography } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { PortfolioSummary } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { useTranslation } from '../../hooks/useTranslation';
import {
  MODULE_STATUS_COLORS,
  PROJECT_STATE_COLORS,
} from '../moduleStatusColors';

const STORAGE_KEY = 'x2a.conversionHub.portfolioStrip.expanded';

const MODULE_BUCKETS = [
  'finished',
  'waiting',
  'pending',
  'running',
  'error',
  'cancelled',
] as const;

const PROJECT_STATES = [
  'created',
  'initializing',
  'initialized',
  'inProgress',
  'completed',
  'failed',
] as const;

function readExpanded(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeExpanded(expanded: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(expanded));
  } catch {
    // The in-memory toggle still works when storage is unavailable.
  }
}

/**
 * Tick positions for a count axis. Steps are 1, 2, 5, or 10 times a power of
 * ten, and never smaller than 1, so the scale does not show fractions.
 */
export function integerCountTicks(max: number): number[] {
  const safeMax = Math.max(0, Math.floor(max));
  if (safeMax === 0) {
    return [0];
  }

  const rawStep = safeMax / 5;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  let nice = 1;
  if (normalized > 5) {
    nice = 10;
  } else if (normalized > 2) {
    nice = 5;
  } else if (normalized > 1) {
    nice = 2;
  }
  const step = Math.max(1, nice * magnitude);

  const ticks: number[] = [];
  for (let value = 0; value <= safeMax; value += step) {
    ticks.push(value);
  }
  return ticks;
}

type CountItem = {
  key: string;
  count: number;
  label: string;
  color: string;
};

function CountLegend({ items }: Readonly<{ items: CountItem[] }>) {
  return (
    <Box
      component="ul"
      display="flex"
      flexWrap="wrap"
      gridGap={12}
      style={{ listStyle: 'none', margin: 0, padding: 0 }}
    >
      {items.map(item => (
        <Box
          component="li"
          key={item.key}
          display="flex"
          alignItems="center"
          gridGap={4}
        >
          <Box
            width={12}
            height={12}
            flexShrink={0}
            style={{ backgroundColor: item.color, borderRadius: 2 }}
            aria-hidden
          />
          <Typography variant="caption">{`${item.count} ${item.label}`}</Typography>
        </Box>
      ))}
    </Box>
  );
}

function CountBar({
  total,
  items,
}: Readonly<{ total: number; items: CountItem[] }>) {
  const series = items
    .filter(item => item.count > 0)
    .map(item => ({
      data: [item.count],
      stack: 'counts',
      color: item.color,
      label: item.label,
    }));
  if (series.length === 0) {
    return null;
  }

  return (
    <BarChart
      layout="horizontal"
      height={80}
      leftAxis={null}
      slotProps={{ legend: { hidden: true } }}
      xAxis={[
        {
          id: DEFAULT_X_AXIS_KEY,
          scaleType: 'linear',
          min: 0,
          max: total,
          domainLimit: 'strict',
          tickInterval: integerCountTicks(total),
          valueFormatter: String,
        },
      ]}
      yAxis={[
        {
          scaleType: 'band',
          data: [''],
          disableTicks: true,
        },
      ]}
      margin={{ left: 8, right: 16, top: 8, bottom: 28 }}
      series={series}
    />
  );
}

export const PortfolioStrip = ({
  portfolio,
}: {
  portfolio: PortfolioSummary;
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(readExpanded);

  const toggle = () => {
    setExpanded(current => {
      const next = !current;
      writeExpanded(next);
      return next;
    });
  };

  const { modules, projectCounts } = portfolio;
  const hasModuleRows = modules.total + modules.removed > 0;
  const moduleItems: CountItem[] = MODULE_BUCKETS.map(bucket => ({
    key: bucket,
    count: modules[bucket],
    label: t(`module.summary.${bucket}`),
    color: MODULE_STATUS_COLORS[bucket],
  }));
  const projectItems: CountItem[] = PROJECT_STATES.map(state => ({
    key: state,
    count: projectCounts[state],
    label: t(`project.statuses.${state}`),
    color: PROJECT_STATE_COLORS[state],
  }));
  const projectTotal = projectItems.reduce((sum, item) => sum + item.count, 0);
  const parts: string[] = [];
  if (hasModuleRows) {
    parts.push(
      t('portfolio.published' as any, {
        n: String(modules.finished),
        m: String(modules.total),
      }),
      t('portfolio.modulesInError' as any, {
        count: String(modules.error),
      }),
    );
  } else {
    parts.push(t('portfolio.noModules'));
  }
  if (portfolio.tokensReported) {
    parts.push(
      t('portfolio.inputTokens' as any, {
        count: millify(portfolio.inputTokens),
      }),
      t('portfolio.outputTokens' as any, {
        count: millify(portfolio.outputTokens),
      }),
    );
  }

  return (
    <Box mb={2} data-testid="portfolio-strip">
      <Box display="flex" alignItems="center">
        <IconButton
          size="small"
          aria-expanded={expanded}
          aria-label={
            expanded ? t('portfolio.collapse') : t('portfolio.expand')
          }
          onClick={toggle}
        >
          <ExpandMoreIcon
            style={{
              transition: 'transform 200ms ease',
              transform: expanded ? 'rotate(180deg)' : 'none',
            }}
          />
        </IconButton>
        <Typography variant="body1" data-testid="portfolio-summary">
          {parts.join(' · ')}
        </Typography>
      </Box>
      {expanded && (
        <Box mt={1} ml={5}>
          {modules.total > 0 && (
            <Box mb={2} data-testid="portfolio-modules">
              <Typography variant="subtitle2">
                {t('portfolio.modules')}
              </Typography>
              <CountLegend items={moduleItems} />
              <CountBar total={modules.total} items={moduleItems} />
            </Box>
          )}
          <Box data-testid="portfolio-projects">
            <Typography variant="subtitle2">
              {t('portfolio.projects')}
            </Typography>
            <CountLegend items={projectItems} />
            <CountBar total={projectTotal} items={projectItems} />
          </Box>
        </Box>
      )}
    </Box>
  );
};

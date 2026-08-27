/**
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

import { useMemo, useState } from 'react';
import {
  Box,
  Drawer,
  Divider,
  Grid,
  IconButton,
  Typography,
  makeStyles,
  useTheme,
} from '@material-ui/core';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import CloseIcon from '@material-ui/icons/Close';
import { Table, TableColumn } from '@backstage/core-components';
import {
  AgentMetrics,
  Telemetry,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import millify from 'millify';

import { useTranslation } from '../hooks/useTranslation';
import { formatDuration } from './tools';
import { ItemField } from './ItemField';

const useStyles = makeStyles(theme => ({
  toolCallList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  toolCallItem: {
    display: 'flex',
    gap: theme.spacing(1),
    lineHeight: 1.8,
  },
  toolCallCount: {
    fontVariantNumeric: 'tabular-nums',
    minWidth: '2ch',
    textAlign: 'right' as const,
    fontWeight: 600,
  },
  drawerPaper: {
    width: 360,
    padding: theme.spacing(2, 3),
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(2),
  },
}));

interface AgentRow extends AgentMetrics {
  id: string;
}

const ToolCallsCell = ({
  toolCalls,
}: {
  toolCalls?: Record<string, number>;
}) => {
  const classes = useStyles();

  if (!toolCalls || Object.keys(toolCalls).length === 0) {
    return <Typography variant="body2">-</Typography>;
  }

  const sorted = Object.entries(toolCalls).sort(([, a], [, b]) => b - a);
  const maxDigits = String(sorted[0][1]).length;

  return (
    <Box component="ul" className={classes.toolCallList}>
      {sorted.map(([tool, count]) => (
        <li key={tool} className={classes.toolCallItem}>
          <Typography
            variant="body2"
            className={classes.toolCallCount}
            style={{ minWidth: `${maxDigits}ch` }}
          >
            {String(count).padStart(maxDigits, '0')}
          </Typography>
          <Typography variant="body2">{tool}</Typography>
        </li>
      ))}
    </Box>
  );
};

const AgentDetailPanel = ({ row }: { row: AgentRow }) => {
  const { t } = useTranslation();

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <ItemField
          label={t('modulePage.phases.telemetry.duration')}
          value={formatDuration(t, row.durationSeconds)}
        />
      </Grid>
      <Grid item xs={6}>
        <ItemField
          label={t('modulePage.phases.telemetry.inputTokens')}
          value={row.inputTokens !== undefined ? millify(row.inputTokens) : '-'}
        />
      </Grid>
      <Grid item xs={6}>
        <ItemField
          label={t('modulePage.phases.telemetry.outputTokens')}
          value={
            row.outputTokens !== undefined ? millify(row.outputTokens) : '-'
          }
        />
      </Grid>
      <Grid item xs={12}>
        <ItemField
          label={t('modulePage.phases.telemetry.toolCalls')}
          value={<ToolCallsCell toolCalls={row.toolCalls} />}
        />
      </Grid>
    </Grid>
  );
};

export const PhaseTelemetry = ({ telemetry }: { telemetry?: Telemetry }) => {
  const { t } = useTranslation();
  const classes = useStyles();
  const theme = useTheme();
  const [selectedAgent, setSelectedAgent] = useState<AgentRow | null>(null);

  const agentRows = useMemo((): AgentRow[] => {
    if (!telemetry?.agents) {
      return [];
    }
    return Object.entries(telemetry.agents).map(([id, metrics]) => ({
      id,
      ...metrics,
    }));
  }, [telemetry]);

  const columns = useMemo((): TableColumn<AgentRow>[] => {
    return [
      {
        title: t('modulePage.phases.telemetry.agentName'),
        render: (row: AgentRow) => row.name,
      },
      {
        title: t('modulePage.phases.telemetry.duration'),
        render: (row: AgentRow) => formatDuration(t, row.durationSeconds),
        width: '120px',
      },
      {
        title: '',
        render: () => <ChevronRightIcon fontSize="small" color="action" />,
        align: 'right',
        width: '40px',
        sorting: false,
      },
    ];
  }, [t]);

  if (agentRows.length === 0) {
    return (
      <Typography variant="body2">
        {t('modulePage.phases.telemetry.noTelemetryAvailable')}
      </Typography>
    );
  }

  return (
    <>
      <Table<AgentRow>
        options={{
          paging: false,
          toolbar: false,
          padding: 'dense',
          search: false,
          rowStyle: (rowData: AgentRow) => ({
            cursor: 'pointer',
            backgroundColor:
              selectedAgent?.id === rowData.id
                ? theme.palette.action.selected
                : undefined,
          }),
        }}
        columns={columns}
        data={agentRows}
        onRowClick={(_event, rowData) => setSelectedAgent(rowData ?? null)}
      />

      <Drawer
        anchor="right"
        open={!!selectedAgent}
        onClose={() => setSelectedAgent(null)}
        classes={{ paper: classes.drawerPaper }}
      >
        {selectedAgent && (
          <>
            <Box className={classes.drawerHeader}>
              <Box>
                <Typography variant="h6">{selectedAgent.name}</Typography>
              </Box>
              <IconButton
                size="small"
                onClick={() => setSelectedAgent(null)}
                aria-label="close"
              >
                <CloseIcon />
              </IconButton>
            </Box>
            <Divider />
            <Box mt={2}>
              <AgentDetailPanel row={selectedAgent} />
            </Box>
          </>
        )}
      </Drawer>
    </>
  );
};

/**
 * Telemetry heading with aggregated token totals and the per-agent table.
 * Renders as `<Grid item>` children, so it must be placed inside a
 * `<Grid container>`. Returns null when there is no telemetry.
 */
export const TelemetrySection = ({ telemetry }: { telemetry?: Telemetry }) => {
  const { t } = useTranslation();

  const tokenTotals = useMemo(() => {
    const all = Object.values(telemetry?.agents ?? {});
    if (all.length === 0) return undefined;
    return {
      inputTokens: all.reduce((s, a) => s + (a.inputTokens ?? 0), 0),
      outputTokens: all.reduce((s, a) => s + (a.outputTokens ?? 0), 0),
    };
  }, [telemetry]);

  if (!telemetry) {
    return null;
  }

  return (
    <>
      <Grid item xs={12}>
        <Grid container alignItems="baseline" spacing={2}>
          <Grid item>
            <Typography variant="h6">
              {t('modulePage.phases.telemetry.title')}
            </Typography>
          </Grid>
          {tokenTotals && (
            <Grid item>
              <Typography variant="body2" color="textSecondary">
                {millify(tokenTotals.inputTokens)}{' '}
                {t('modulePage.phases.telemetry.totalInputTokens')}
                {' · '}
                {millify(tokenTotals.outputTokens)}{' '}
                {t('modulePage.phases.telemetry.totalOutputTokens')}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <PhaseTelemetry telemetry={telemetry} />
      </Grid>
    </>
  );
};

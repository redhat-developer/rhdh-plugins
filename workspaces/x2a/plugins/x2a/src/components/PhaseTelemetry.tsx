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

import { useMemo } from 'react';
import { Box, Typography, makeStyles } from '@material-ui/core';
import { Table, TableColumn } from '@backstage/core-components';
import {
  AgentMetrics,
  Telemetry,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { useTranslation } from '../hooks/useTranslation';
import { RelativeTimeFormatter } from './tools';

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
    textAlign: 'right',
    fontWeight: 600,
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

  const sortedToolCalls = Object.entries(toolCalls).sort(
    ([, countA], [, countB]) => countB - countA,
  );

  const maxDigits = String(sortedToolCalls[0][1]).length;

  return (
    <Box component="ul" className={classes.toolCallList}>
      {sortedToolCalls.map(([tool, count]) => (
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

export const PhaseTelemetry = ({ telemetry }: { telemetry?: Telemetry }) => {
  const { t } = useTranslation();

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
        field: 'name',
      },
      {
        title: t('modulePage.phases.telemetry.duration'),
        render: (row: AgentRow) =>
          RelativeTimeFormatter.fromSeconds(row.durationSeconds),
        align: 'right',
      },
      {
        title: t('modulePage.phases.telemetry.toolCalls'),
        render: (row: AgentRow) => <ToolCallsCell toolCalls={row.toolCalls} />,
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
    <Table<AgentRow>
      options={{
        paging: false,
        toolbar: false,
        padding: 'dense',
        search: false,
      }}
      columns={columns}
      data={agentRows}
    />
  );
};

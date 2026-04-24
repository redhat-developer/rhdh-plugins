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

import {
  StatusOK,
  StatusWarning,
  StatusError,
  StatusAborted,
  StatusPending,
  StatusRunning,
} from '@backstage/core-components';
import { Box, makeStyles, Typography } from '@material-ui/core';

const useStyles = makeStyles({
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(0,0,0,0.2)',
    borderRadius: 16,
    padding: '2px 10px 2px 6px',
    gap: 4,
    whiteSpace: 'nowrap' as const,
    '& *': {
      fontSize: '0.75rem !important',
      lineHeight: '1.4 !important',
    },
    '& svg': {
      width: '0.875rem !important',
      height: '0.875rem !important',
    },
  },
});

/**
 * Maps a provider `health_status` string to a Backstage Status component.
 *
 * Mapping:
 *   ready / ok / healthy / active   → StatusOK
 *   degraded / warning              → StatusWarning
 *   error / failed / unhealthy      → StatusError
 *   running / starting              → StatusRunning
 *   aborted / terminated / deleted  → StatusAborted
 *   not_ready / pending / (other)   → StatusPending
 */
export function ProviderStatus({ value }: Readonly<{ value?: string }>) {
  const classes = useStyles();

  if (!value) {
    return (
      <Typography variant="caption" color="textSecondary">
        —
      </Typography>
    );
  }

  const normalised = value.toLowerCase().replaceAll(/[_-]/g, '');

  let StatusComponent: React.ElementType;
  if (['ready', 'ok', 'healthy', 'active'].includes(normalised)) {
    StatusComponent = StatusOK;
  } else if (['degraded', 'warning'].includes(normalised)) {
    StatusComponent = StatusWarning;
  } else if (['error', 'failed', 'unhealthy'].includes(normalised)) {
    StatusComponent = StatusError;
  } else if (['running', 'starting'].includes(normalised)) {
    StatusComponent = StatusRunning;
  } else if (['aborted', 'terminated', 'deleted'].includes(normalised)) {
    StatusComponent = StatusAborted;
  } else {
    StatusComponent = StatusPending;
  }

  return (
    <Box className={classes.chip}>
      <StatusComponent>{value}</StatusComponent>
    </Box>
  );
}

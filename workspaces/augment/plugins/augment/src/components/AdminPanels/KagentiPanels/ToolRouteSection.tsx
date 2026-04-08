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

import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import { PropertyRow } from './KagentiPropertyRow';
import type { KagentiRouteStatus } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import {
  formatValue,
  routeReadyChipColor,
  routeStatusStringChipColor,
} from './kagentiDisplayUtils';

export interface ToolRouteSectionProps {
  routeLoading: boolean;
  routeError: string | null;
  routeStatus: KagentiRouteStatus | null;
}

export function ToolRouteSection({
  routeLoading,
  routeError,
  routeStatus,
}: ToolRouteSectionProps): ReactNode {
  if (routeLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }
  if (routeError) {
    return <Alert severity="error">{routeError}</Alert>;
  }
  if (!routeStatus || Object.keys(routeStatus).length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No route status data.
      </Typography>
    );
  }

  const hasRoute =
    'hasRoute' in routeStatus ? (routeStatus as Record<string, unknown>).hasRoute : undefined;

  if (hasRoute === false && Object.keys(routeStatus).length === 1) {
    return (
      <Typography variant="body2" color="text.secondary">
        No external route configured. The tool is accessible only within the
        cluster via its internal service DNS name.
      </Typography>
    );
  }

  const routeReady = 'ready' in routeStatus ? routeStatus.ready : undefined;
  const routeStatusField =
    'status' in routeStatus ? routeStatus.status : undefined;

  const displayEntries = Object.entries(routeStatus).filter(
    ([key]) => key !== 'hasRoute',
  );

  return (
    <>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
        {routeReady !== undefined && (
          <Chip
            size="small"
            label={routeReady ? 'Route ready' : 'Route not ready'}
            color={routeReadyChipColor(routeReady)}
          />
        )}
        {routeStatusField !== undefined && routeStatusField !== null && (
          <Chip
            size="small"
            label={`${formatValue(routeStatusField)}`}
            color={routeStatusStringChipColor(routeStatusField)}
          />
        )}
      </Box>
      {displayEntries.length > 0 && (
        <>
          <Divider sx={{ my: 1.5 }} />
          {displayEntries.map(([key, val]) => (
            <PropertyRow key={key} label={key} value={formatValue(val)} />
          ))}
        </>
      )}
    </>
  );
}

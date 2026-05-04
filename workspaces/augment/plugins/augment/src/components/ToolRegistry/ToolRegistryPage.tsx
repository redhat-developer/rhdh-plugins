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

import { lazy, Suspense, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import { useTheme } from '@mui/material/styles';
import { typeScale } from '../../theme/tokens';
import { useAppState } from '../AugmentPage/AppStateProvider';
import type { ToolPanelTourControl } from '../AdminPanels/KagentiPanels/KagentiToolsPanel';

const KagentiToolsPanelLazy = lazy(() =>
  import('../AdminPanels/KagentiPanels/KagentiToolsPanel').then(m => ({
    default: m.KagentiToolsPanel,
  })),
);

/**
 * Tool Registry page — structured view for managing MCP tool servers.
 * Wraps the existing tools panel with proper page-level chrome.
 */
export function ToolRegistryPage() {
  const theme = useTheme();
  const { kagentiNamespace } = useAppState();
  const toolTourRef = useRef<ToolPanelTourControl | null>(null);

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            fontSize: typeScale.pageTitle.fontSize,
            color: theme.palette.text.primary,
            mb: 0.5,
          }}
        >
          Tool Registry
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          Register, configure, and manage MCP tool servers for your agents.
        </Typography>
      </Box>

      <Suspense
        fallback={
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Skeleton variant="rounded" height={40} />
            <Skeleton variant="rounded" height={200} />
          </Box>
        }
      >
        <KagentiToolsPanelLazy
          namespace={kagentiNamespace || undefined}
          tourControlRef={toolTourRef}
        />
      </Suspense>
    </Box>
  );
}

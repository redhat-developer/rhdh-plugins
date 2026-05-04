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

import { lazy, Suspense, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Skeleton from '@mui/material/Skeleton';
import { useTheme } from '@mui/material/styles';
import { typeScale } from '../../theme/tokens';
import { useAppState } from '../AugmentPage/AppStateProvider';

type ObserveTab = 'dashboards' | 'registry';

const KagentiDashboardLinksLazy = lazy(() =>
  import('../AdminPanels/KagentiPanels/KagentiDashboardLinks').then(m => ({
    default: m.KagentiDashboardLinks,
  })),
);

const AgentRegistryPanelLazy = lazy(() =>
  import('../AdminPanels/AgentRegistryPanel/AgentRegistryPanel').then(m => ({
    default: m.AgentRegistryPanel,
  })),
);

/**
 * Observability Hub — dashboards, agent registry lifecycle, and monitoring.
 */
export function ObservePage() {
  const theme = useTheme();
  const { kagentiNamespace } = useAppState();
  const [activeTab, setActiveTab] = useState<ObserveTab>('dashboards');

  const handleTabChange = useCallback((_: unknown, val: string) => {
    setActiveTab(val as ObserveTab);
  }, []);

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
          Observe
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          Monitor agent health, view traces, and manage deployment lifecycle.
        </Typography>
      </Box>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{
          minHeight: 40,
          mb: 2,
          '& .MuiTab-root': {
            minHeight: 40,
            textTransform: 'none',
            fontSize: typeScale.body.fontSize,
          },
        }}
      >
        <Tab label="Dashboards" value="dashboards" />
        <Tab label="Agent Registry" value="registry" />
      </Tabs>

      <Suspense
        fallback={
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Skeleton variant="rounded" height={40} />
            <Skeleton variant="rounded" height={200} />
          </Box>
        }
      >
        {activeTab === 'dashboards' && (
          <KagentiDashboardLinksLazy namespace={kagentiNamespace || undefined} />
        )}
        {activeTab === 'registry' && <AgentRegistryPanelLazy />}
      </Suspense>
    </Box>
  );
}

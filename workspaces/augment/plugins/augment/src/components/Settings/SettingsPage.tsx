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

type SettingsTab = 'platform' | 'branding' | 'admin' | 'docs';

const AgentConfigPanelLazy = lazy(() =>
  import('../AdminPanels').then(m => ({ default: m.AgentConfigPanel })),
);
const BrandingPanelLazy = lazy(() =>
  import('../AdminPanels').then(m => ({ default: m.BrandingPanel })),
);
const KagentiAdminPanelLazy = lazy(() =>
  import('../AdminPanels/KagentiPanels/KagentiAdminPanel').then(m => ({
    default: m.KagentiAdminPanel,
  })),
);
const DocsPanelLazy = lazy(() =>
  import('../AdminPanels/DocsPanel').then(m => ({ default: m.DocsPanel })),
);

interface SettingsPageProps {
  initialTab?: SettingsTab;
}

/**
 * Settings page — unified view for Platform Config, Branding, Administration, and Docs.
 */
export function SettingsPage({ initialTab = 'platform' }: SettingsPageProps) {
  const theme = useTheme();
  const { kagentiNamespace } = useAppState();
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  const handleTabChange = useCallback((_: unknown, val: string) => {
    setActiveTab(val as SettingsTab);
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
          Settings
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          Configure the platform, customize branding, and manage system settings.
        </Typography>
      </Box>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
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
        <Tab label="Platform Config" value="platform" />
        <Tab label="Branding" value="branding" />
        <Tab label="Administration" value="admin" />
        <Tab label="Documentation" value="docs" />
      </Tabs>

      <Suspense
        fallback={
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Skeleton variant="rounded" height={40} />
            <Skeleton variant="rounded" height={300} />
          </Box>
        }
      >
        {activeTab === 'platform' && <AgentConfigPanelLazy />}
        {activeTab === 'branding' && <BrandingPanelLazy />}
        {activeTab === 'admin' && (
          <KagentiAdminPanelLazy namespace={kagentiNamespace || undefined} />
        )}
        {activeTab === 'docs' && <DocsPanelLazy />}
      </Suspense>
    </Box>
  );
}

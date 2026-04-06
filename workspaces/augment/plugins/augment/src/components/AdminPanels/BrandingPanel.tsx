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
import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { Progress } from '@backstage/core-components';
import { useEffectiveConfig, useStatus } from '../../hooks';
import { AppearanceSection } from './AppearanceSection';
import { PromptsPanel } from './PromptsPanel/PromptsPanel';
import { ChatExperiencePanel } from './ChatExperiencePanel';

type SubTab = 'appearance' | 'promptGroups' | 'chatExperience';

const TABS_SX = {
  minHeight: 36,
  '& .MuiTab-root': {
    minHeight: 36,
    textTransform: 'none',
    fontSize: '0.8125rem',
    minWidth: 'auto',
    px: 2,
    mr: 0.5,
  },
} as const;

export const BrandingPanel = () => {
  const [activeTab, setActiveTab] = useState<SubTab>('appearance');
  const { config: effectiveConfig, loading: ecLoading } = useEffectiveConfig();
  const { status } = useStatus();
  const isKagenti = status?.providerId === 'kagenti';

  // Reset to a visible tab when the Chat Experience tab disappears
  useEffect(() => {
    if (!isKagenti && activeTab === 'chatExperience') {
      setActiveTab('appearance');
    }
  }, [isKagenti, activeTab]);

  if (ecLoading) {
    return <Progress />;
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ px: 3, pt: 2, maxWidth: 960, mx: 'auto' }}>
        <Typography variant="h5" gutterBottom>
          Branding
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
          Customize how the chat interface looks and feels to users.
        </Typography>
      </Box>

      <Box
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          mb: 0,
          px: 3,
          maxWidth: 960,
          mx: 'auto',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v as SubTab)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={TABS_SX}
        >
          <Tab label="Appearance" value="appearance" />
          <Tab label="Prompt Groups" value="promptGroups" />
          {isKagenti && <Tab label="Chat Experience" value="chatExperience" />}
        </Tabs>
      </Box>

      {activeTab === 'appearance' && (
        <Box sx={{ px: 3, py: 2, maxWidth: 960, mx: 'auto' }}>
          <AppearanceSection effectiveConfig={effectiveConfig} />
        </Box>
      )}
      {activeTab === 'promptGroups' && <PromptsPanel />}
      {activeTab === 'chatExperience' && isKagenti && <ChatExperiencePanel />}
    </Box>
  );
};

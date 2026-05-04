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

import { useState, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { useTheme } from '@mui/material/styles';
import { typeScale } from '../../theme/tokens';
import { useAppState } from '../AugmentPage/AppStateProvider';
import type { AgentPanelTourControl } from '../AdminPanels/KagentiPanels/KagentiAgentsPanel';

type StudioTab = 'catalog' | 'sandbox' | 'builds';

interface AgentStudioPageProps {
  initialTab?: StudioTab;
  onChatWithAgent?: (agentId: string) => void;
  onFullScreenChange?: (fs: boolean) => void;
}

/**
 * Agent Studio page — unified view for agent catalog, sandbox, and builds.
 * Combines what was previously separate flat panels into a tabbed experience.
 */
export function AgentStudioPage({
  initialTab = 'catalog',
  onChatWithAgent,
  onFullScreenChange,
}: AgentStudioPageProps) {
  const theme = useTheme();
  const { kagentiNamespace } = useAppState();
  const [activeTab, setActiveTab] = useState<StudioTab>(initialTab);
  const agentTourRef = useRef<AgentPanelTourControl | null>(null);

  const handleTabChange = useCallback((_: unknown, val: string) => {
    setActiveTab(val as StudioTab);
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
          Agent Studio
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          Build, test, and deploy AI agents.
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
        <Tab label="Agent Catalog" value="catalog" />
        <Tab label="Sandbox" value="sandbox" />
        <Tab label="Build Pipelines" value="builds" />
      </Tabs>

      {activeTab === 'catalog' && (
        <AgentCatalogLazy
          namespace={kagentiNamespace}
          onChatWithAgent={onChatWithAgent}
          onFullScreenChange={onFullScreenChange}
          tourControlRef={agentTourRef}
        />
      )}
      {activeTab === 'sandbox' && (
        <SandboxLazy namespace={kagentiNamespace} />
      )}
      {activeTab === 'builds' && (
        <BuildsLazy namespace={kagentiNamespace} />
      )}
    </Box>
  );
}

// Lazy wrappers to avoid heavy imports until tab is active
import { lazy, Suspense } from 'react';
import Skeleton from '@mui/material/Skeleton';

const KagentiAgentsPanelLazy = lazy(() =>
  import('../AdminPanels/KagentiPanels/KagentiAgentsPanel').then(m => ({
    default: m.KagentiAgentsPanel,
  })),
);
const KagentiSandboxPanelLazy = lazy(() =>
  import('../AdminPanels/KagentiPanels/KagentiSandboxPanel').then(m => ({
    default: m.KagentiSandboxPanel,
  })),
);
const KagentiBuildPipelinePanelLazy = lazy(() =>
  import('../AdminPanels/KagentiPanels/KagentiBuildPipelinePanel').then(m => ({
    default: m.KagentiBuildPipelinePanel,
  })),
);

function LoadingFallback() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, py: 2 }}>
      <Skeleton variant="rounded" height={40} />
      <Skeleton variant="rounded" height={200} />
      <Skeleton variant="rounded" height={60} />
    </Box>
  );
}

function AgentCatalogLazy(props: {
  namespace: string;
  onChatWithAgent?: (id: string) => void;
  onFullScreenChange?: (fs: boolean) => void;
  tourControlRef: React.MutableRefObject<AgentPanelTourControl | null>;
}) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <KagentiAgentsPanelLazy
        namespace={props.namespace || undefined}
        onChatWithAgent={props.onChatWithAgent}
        onFullScreenChange={props.onFullScreenChange}
        tourControlRef={props.tourControlRef}
      />
    </Suspense>
  );
}

function SandboxLazy(props: { namespace: string }) {
  if (!props.namespace) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Select a namespace from the sidebar to manage sandbox sessions.
        </Typography>
      </Box>
    );
  }
  return (
    <Suspense fallback={<LoadingFallback />}>
      <KagentiSandboxPanelLazy namespace={props.namespace} />
    </Suspense>
  );
}

function BuildsLazy(props: { namespace: string }) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <KagentiBuildPipelinePanelLazy namespace={props.namespace || undefined} />
    </Suspense>
  );
}

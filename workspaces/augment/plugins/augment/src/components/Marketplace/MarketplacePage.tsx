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

import { useEffect, useState, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import { useTheme, alpha } from '@mui/material/styles';
import { useApi } from '@backstage/core-plugin-api';
import type { ChatAgent, KagentiToolSummary } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { augmentApiRef } from '../../api';
import { MarketplaceHero } from './MarketplaceHero';
import { MarketplaceSearch } from './MarketplaceSearch';
import { AgentGrid } from './AgentGrid';
import { pageSx, tabSx, gridContainerSx } from './marketplace.styles';
import { CARD_HEIGHT, getFrameworkColor, LIFECYCLE_STAGE_CONFIG } from './marketplace.constants';

interface MarketplacePageProps {
  onChatWithAgent?: (agentId: string) => void;
  onCreateAgent?: () => void;
  onCreateTool?: () => void;
  onAgentDetail?: (agentId: string) => void;
  isAdmin?: boolean;
  onOpenCommandCenter?: () => void;
}

/**
 * Agent Marketplace -- the Front Door.
 * Thin orchestrator: state + data fetching + tab routing.
 * All visual treatment lives in marketplace.styles.ts and sub-components.
 */
export function MarketplacePage({
  onChatWithAgent,
  onCreateAgent,
  onCreateTool,
  onAgentDetail,
  isAdmin,
  onOpenCommandCenter,
}: MarketplacePageProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const api = useApi(augmentApiRef);

  const [agents, setAgents] = useState<ChatAgent[]>([]);
  const [tools, setTools] = useState<(KagentiToolSummary & { published?: boolean; lifecycleStage?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [toolsLoading, setToolsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'explore' | 'my-agents'>('explore');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.listAgents()
      .then(result => { if (!cancelled) setAgents(result); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [api]);

  useEffect(() => {
    let cancelled = false;
    setToolsLoading(true);
    api.listToolsWithLifecycle()
      .then(result => { if (!cancelled) setTools(result); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setToolsLoading(false); });
    return () => { cancelled = true; };
  }, [api]);

  const frameworks = useMemo(() => {
    const set = new Set<string>();
    agents.forEach(a => { if (a.framework) set.add(a.framework); });
    return Array.from(set).sort();
  }, [agents]);

  const exploreAgents = useMemo(() => {
    const lc = search.toLowerCase();
    return agents.filter(a => {
      if (a.lifecycleStage !== 'deployed' && a.published !== true) return false;
      if (lc && !a.name.toLowerCase().includes(lc) && !(a.description || '').toLowerCase().includes(lc)) return false;
      if (selectedFramework && a.framework !== selectedFramework) return false;
      return true;
    });
  }, [agents, search, selectedFramework]);

  // My Agents: show ALL agents with their lifecycle stage visible
  const myAgents = useMemo(() => agents, [agents]);

  // Tools catalog: only deployed/published tools
  const exploreTools = useMemo(() =>
    tools.filter(t => t.lifecycleStage === 'deployed' || t.published === true),
  [tools]);

  // My Tools: show ALL tools with lifecycle badges
  const myTools = useMemo(() => tools, [tools]);

  const handleChat = useCallback((agentId: string) => {
    onChatWithAgent?.(agentId);
  }, [onChatWithAgent]);

  return (
    <Box sx={pageSx}>
      {/* Hero */}
      <MarketplaceHero
        isAdmin={isAdmin}
        onOpenCommandCenter={onOpenCommandCenter}
      />

      {/* Tabs */}
      <Box sx={{ mb: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, isDark ? 0.1 : 0.06)}` }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={tabSx(theme, isDark)}>
          <Tab
            label={`Explore${(exploreAgents.length + exploreTools.length) > 0 ? ` (${exploreAgents.length + exploreTools.length})` : ''}`}
            value="explore"
            icon={<ChatBubbleOutlineIcon sx={{ fontSize: 15 }} />}
            iconPosition="start"
          />
          <Tab
            label={`My Agents${(myAgents.length + myTools.length) > 0 ? ` (${myAgents.length + myTools.length})` : ''}`}
            value="my-agents"
            icon={<SmartToyOutlinedIcon sx={{ fontSize: 15 }} />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Explore Tab -- published agents + published tools */}
      {activeTab === 'explore' && (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto' }}>
          <MarketplaceSearch
            search={search}
            onSearchChange={setSearch}
            frameworks={frameworks}
            selectedFramework={selectedFramework}
            onFrameworkChange={setSelectedFramework}
            resultCount={exploreAgents.length}
          />
          <AgentGrid
            agents={exploreAgents}
            loading={loading}
            onAgentClick={handleChat}
            emptyMessage={search ? `No agents match "${search}"` : 'No published agents yet.'}
            emptyAction={onCreateAgent ? { label: 'Create Agent', onClick: onCreateAgent } : undefined}
          />

          {/* Tools section (subset of agents) */}
          {exploreTools.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1.5 }}>
                Tools ({exploreTools.length})
              </Typography>
              <Box sx={gridContainerSx(isDark)}>
                {exploreTools.map(tool => (
                  <CompactToolCard key={`${tool.namespace}/${tool.name}`} tool={tool} />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* My Agents Tab -- all agents + all tools with lifecycle */}
      {activeTab === 'my-agents' && (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto' }}>
          {(onCreateAgent || onCreateTool) && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 1.5 }}>
              {onCreateAgent && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={onCreateAgent}
                  sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, boxShadow: 'none' }}
                >
                  + Create Agent
                </Button>
              )}
              {onCreateTool && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={onCreateTool}
                  sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                >
                  + Create Tool
                </Button>
              )}
            </Box>
          )}
          <AgentGrid
            agents={myAgents}
            loading={loading}
            onAgentClick={(id) => { if (onAgentDetail) { onAgentDetail(id); } else { handleChat(id); } }}
            emptyMessage="Agents you create will appear here."
            emptyAction={onCreateAgent ? { label: 'Create Your First Agent', onClick: onCreateAgent } : undefined}
          />

          {/* My Tools section (subset under agents) */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1.5 }}>
              My Tools ({myTools.length})
            </Typography>
            {toolsLoading && (
              <Box sx={gridContainerSx(isDark)}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} variant="rounded" height={CARD_HEIGHT} sx={{ borderRadius: 2 }} />
                ))}
              </Box>
            )}
            {!toolsLoading && myTools.length === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 1 }}>
                <ExtensionOutlinedIcon sx={{ fontSize: 32, color: theme.palette.text.disabled }} />
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 320, fontSize: '0.8rem' }}>
                  Tools give agents abilities. Create MCP tool servers here.
                </Typography>
              </Box>
            )}
            {!toolsLoading && myTools.length > 0 && (
              <Box sx={gridContainerSx(isDark)}>
                {myTools.map(tool => (
                  <CompactToolCard key={`${tool.namespace}/${tool.name}`} tool={tool} showLifecycle />
                ))}
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}

// Compact tool card (same density as agent cards)
function CompactToolCard({ tool, showLifecycle }: { tool: KagentiToolSummary & { lifecycleStage?: string }; showLifecycle?: boolean }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const fwColor = getFrameworkColor(tool.labels?.framework);
  const isReady = tool.status?.toLowerCase() === 'ready';
  const stageConfig = showLifecycle && tool.lifecycleStage
    ? LIFECYCLE_STAGE_CONFIG[tool.lifecycleStage]
    : undefined;

  return (
    <Box
      sx={{
        height: CARD_HEIGHT,
        display: 'flex',
        alignItems: 'stretch',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: isDark ? alpha(theme.palette.background.paper, 0.5) : theme.palette.background.paper,
        border: `1px solid ${alpha(isDark ? theme.palette.common.white : theme.palette.common.black, isDark ? 0.07 : 0.05)}`,
        boxShadow: isDark ? `0 1px 4px ${alpha('#000', 0.15)}` : `0 1px 4px ${alpha('#000', 0.03)}`,
      }}
    >
      <Box sx={{ width: 3, flexShrink: 0, bgcolor: alpha(fwColor, isReady ? 0.7 : 0.2) }} />
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, minWidth: 0 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: alpha(fwColor, isDark ? 0.2 : 0.1),
            color: fwColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ExtensionOutlinedIcon sx={{ fontSize: 16 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 700, fontSize: '0.85rem', color: theme.palette.text.primary }}>
              {tool.name}
            </Typography>
            {isReady && (
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: theme.palette.success.main, boxShadow: `0 0 6px ${alpha(theme.palette.success.main, 0.5)}` }} />
            )}
            {stageConfig && (
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.6rem',
                  fontWeight: 600,
                  px: 0.75,
                  py: 0.15,
                  borderRadius: 1,
                  bgcolor: alpha(stageConfig.color, isDark ? 0.15 : 0.1),
                  color: stageConfig.color,
                  lineHeight: 1.4,
                }}
              >
                {stageConfig.label}
              </Typography>
            )}
          </Box>
          <Typography variant="caption" noWrap sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem', display: 'block', mt: 0.25 }}>
            {tool.description || `${tool.namespace}/${tool.name}`}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

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

import { useEffect, useState, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { useTheme, alpha } from '@mui/material/styles';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WorkspacesOutlinedIcon from '@mui/icons-material/WorkspacesOutlined';
import NoteAddOutlinedIcon from '@mui/icons-material/NoteAddOutlined';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BuildCircleOutlinedIcon from '@mui/icons-material/BuildCircleOutlined';
import { useApi } from '@backstage/core-plugin-api';
import { augmentApiRef } from '../../../api';
import type { AdminPanel } from '../../../hooks';
import type {
  KagentiAgentSummary,
  KagentiToolSummary,
  KagentiBuildListItem,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import {
  CONTENT_MAX_WIDTH,
  HOVER_TRANSITION,
  PAGE_TITLE_SX,
  PAGE_SUBTITLE_SX,
  SECTION_LABEL_SX,
  TABLE_HEADER_CELL_SX,
  subtleBorder,
  tableContainerSx,
} from '../shared/commandCenterStyles';

export interface KagentiHomeDashboardProps {
  namespace?: string;
  onNavigate: (panel: AdminPanel, focusName?: string) => void;
  onCreateAgent?: () => void;
}

interface DashboardData {
  agents: KagentiAgentSummary[];
  tools: KagentiToolSummary[];
  builds: KagentiBuildListItem[];
  namespaceCount: number;
}

const GETTING_STARTED_KEY = 'augment:kagenti-getting-started-dismissed';

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '--';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 0) return 'just now';
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function statusColor(
  status: string,
  palette: {
    success: { main: string };
    warning: { main: string };
    error: { main: string };
    text: { secondary: string };
  },
): string {
  const s = status?.toLowerCase() ?? '';
  if (s === 'ready' || s === 'succeeded' || s === 'true')
    return palette.success.main;
  if (s === 'running' || s === 'pending' || s === 'building')
    return palette.warning.main;
  if (s === 'failed' || s === 'error' || s === 'crashloopbackoff')
    return palette.error.main;
  return palette.text.secondary;
}

type HealthRow = {
  name: string;
  namespace: string;
  kind: 'Agent' | 'Tool';
  status: string;
  framework?: string;
  createdAt?: string;
};

export function KagentiHomeDashboard({
  namespace,
  onNavigate,
  onCreateAgent,
}: KagentiHomeDashboardProps) {
  const theme = useTheme();
  const api = useApi(augmentApiRef);
  const isDark = theme.palette.mode === 'dark';

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [showGettingStarted, setShowGettingStarted] = useState(() => {
    try {
      return !localStorage.getItem(GETTING_STARTED_KEY);
    } catch {
      return true;
    }
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [agentsRes, toolsRes, nsRes, buildsRes] = await Promise.all([
        api.listKagentiAgents(namespace || undefined),
        api.listKagentiTools(namespace || undefined),
        api.listKagentiNamespaces(),
        api
          .listKagentiShipwrightBuilds(namespace ? { namespace } : undefined)
          .catch(() => ({ builds: [] as KagentiBuildListItem[] })),
      ]);
      setData({
        agents: agentsRes.agents ?? [],
        tools: toolsRes.tools ?? [],
        builds: buildsRes.builds ?? [],
        namespaceCount: nsRes.namespaces?.length ?? 0,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [api, namespace]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const dismissGettingStarted = () => {
    setShowGettingStarted(false);
    try {
      localStorage.setItem(GETTING_STARTED_KEY, '1');
    } catch {
      /* noop */
    }
  };

  const totalAgents = data?.agents.length ?? 0;
  const readyAgents =
    data?.agents.filter(a => a.status?.toLowerCase() === 'ready').length ?? 0;
  const totalTools = data?.tools.length ?? 0;
  const readyTools =
    data?.tools.filter(t => t.status?.toLowerCase() === 'ready').length ?? 0;
  const allAgentsHealthy = totalAgents > 0 && readyAgents === totalAgents;
  const allToolsHealthy = totalTools > 0 && readyTools === totalTools;

  const healthRows = useMemo<HealthRow[]>(() => {
    const agents: HealthRow[] = (data?.agents ?? []).map(a => ({
      name: a.name,
      namespace: a.namespace,
      kind: 'Agent',
      status: a.status,
      framework: a.labels?.framework,
      createdAt: a.createdAt,
    }));
    const tools: HealthRow[] = (data?.tools ?? []).map(t => ({
      name: t.name,
      namespace: t.namespace,
      kind: 'Tool',
      status: t.status,
      createdAt: t.createdAt,
    }));
    const all = [...agents, ...tools];
    all.sort((a, b) => {
      const aReady = a.status?.toLowerCase() === 'ready' ? 1 : 0;
      const bReady = b.status?.toLowerCase() === 'ready' ? 1 : 0;
      if (aReady !== bReady) return aReady - bReady;
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
    return all;
  }, [data]);

  const recentBuilds = useMemo(() => {
    const sorted = [...(data?.builds ?? [])].sort((a, b) => {
      const aTime = a.creationTimestamp
        ? new Date(a.creationTimestamp).getTime()
        : 0;
      const bTime = b.creationTimestamp
        ? new Date(b.creationTimestamp).getTime()
        : 0;
      return bTime - aTime;
    });
    return sorted.slice(0, 5);
  }, [data]);

  const statCards = [
    {
      label: 'Total Agents',
      value: totalAgents,
      icon: <HubOutlinedIcon />,
      accent: theme.palette.primary.main,
    },
    {
      label: 'Ready Agents',
      value: `${readyAgents} / ${totalAgents}`,
      icon: allAgentsHealthy ? <CheckCircleIcon /> : <WarningAmberIcon />,
      accent: allAgentsHealthy
        ? theme.palette.success.main
        : theme.palette.warning.main,
    },
    {
      label: 'Ready Tools',
      value: `${readyTools} / ${totalTools}`,
      icon: allToolsHealthy ? <CheckCircleIcon /> : <WarningAmberIcon />,
      accent: allToolsHealthy
        ? theme.palette.success.main
        : theme.palette.warning.main,
    },
    {
      label: 'Namespaces',
      value: data?.namespaceCount ?? 0,
      icon: <WorkspacesOutlinedIcon />,
      accent: theme.palette.info.main,
    },
  ];

  const createActions = [
    {
      label: 'New Agent',
      description: 'Import or build a new AI agent',
      icon: <NoteAddOutlinedIcon sx={{ fontSize: 24 }} />,
      accent: theme.palette.primary.main,
      panel: 'kagenti-agents' as AdminPanel,
      action: onCreateAgent,
    },
    {
      label: 'New Tool',
      description: 'Register an MCP tool server',
      icon: <ExtensionOutlinedIcon sx={{ fontSize: 24 }} />,
      accent: theme.palette.info.main,
      panel: 'kagenti-tools' as AdminPanel,
    },
  ];

  const gettingStartedSteps = [
    {
      step: 1,
      title: 'Import an agent',
      description: 'Start by importing an agent from the examples repository.',
    },
    {
      step: 2,
      title: 'Chat with it',
      description: 'Then chat with it to see it in action.',
    },
    {
      step: 3,
      title: 'Monitor & observe',
      description:
        'Use the observability dashboards to monitor traces and network traffic.',
    },
  ];

  const thStyle = TABLE_HEADER_CELL_SX;

  function renderLoadingSkeleton() {
    return (
      <Box sx={{ p: 3 }}>
        {[0, 1, 2].map(i => (
          <Skeleton key={i} variant="text" height={40} sx={{ mb: 1 }} />
        ))}
      </Box>
    );
  }

  function renderHealthContent() {
    if (loading) return renderLoadingSkeleton();
    if (healthRows.length === 0) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            No agents or tools deployed yet. Create one to get started.
          </Typography>
        </Box>
      );
    }
    return (
      <TableContainer sx={{ maxHeight: 480, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={thStyle}>Name</TableCell>
              <TableCell sx={thStyle}>Type</TableCell>
              <TableCell sx={thStyle}>Status</TableCell>
              <TableCell sx={thStyle}>Namespace</TableCell>
              <TableCell sx={thStyle}>Framework</TableCell>
              <TableCell sx={thStyle}>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {healthRows.map(row => {
              return (
                <TableRow
                  key={`${row.kind}-${row.namespace}-${row.name}`}
                  hover
                  sx={{
                    cursor: 'pointer',
                    '&:last-child td': { borderBottom: 0 },
                  }}
                  onClick={() =>
                    onNavigate(
                      (row.kind === 'Agent'
                        ? 'kagenti-agents'
                        : 'kagenti-tools') as AdminPanel,
                      row.name,
                    )
                  }
                >
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        color: 'text.primary',
                      }}
                    >
                      {row.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.kind}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontSize: '0.75rem',
                        height: 24,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.status || 'Unknown'}
                      size="small"
                      sx={{
                        fontSize: '0.75rem',
                        height: 24,
                        fontWeight: 600,
                        bgcolor: alpha(
                          statusColor(row.status, theme.palette),
                          isDark ? 0.15 : 0.1,
                        ),
                        color: statusColor(row.status, theme.palette),
                        border: 'none',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="textSecondary">
                      {row.namespace}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="textSecondary">
                      {row.framework || '--'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="textSecondary">
                      {timeAgo(row.createdAt)}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  function renderBuildsContent() {
    if (loading) return renderLoadingSkeleton();
    if (recentBuilds.length === 0) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            No builds yet. Trigger a build from an agent or tool to see activity
            here.
          </Typography>
        </Box>
      );
    }
    return (
      <TableContainer sx={{ maxHeight: 480, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={thStyle}>Build</TableCell>
              <TableCell sx={thStyle}>Namespace</TableCell>
              <TableCell sx={thStyle}>Status</TableCell>
              <TableCell sx={thStyle}>Strategy</TableCell>
              <TableCell sx={thStyle}>Started</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recentBuilds.map(build => {
              const regColor = build.registered
                ? theme.palette.success.main
                : theme.palette.warning.main;
              return (
                <TableRow
                  key={`${build.namespace}-${build.name}`}
                  hover
                  sx={{
                    cursor: 'pointer',
                    '&:last-child td': { borderBottom: 0 },
                  }}
                  onClick={() => onNavigate('kagenti-builds' as AdminPanel)}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BuildCircleOutlinedIcon
                        sx={{
                          fontSize: 18,
                          color: theme.palette.text.secondary,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          color: 'text.primary',
                        }}
                      >
                        {build.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="textSecondary">
                      {build.namespace}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={build.registered ? 'Registered' : 'Pending'}
                      size="small"
                      sx={{
                        fontSize: '0.75rem',
                        height: 24,
                        fontWeight: 600,
                        bgcolor: alpha(regColor, isDark ? 0.15 : 0.1),
                        color: regColor,
                        border: 'none',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="textSecondary">
                      {build.strategy || '--'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="textSecondary">
                      {timeAgo(build.creationTimestamp)}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  return (
    <Box sx={{ maxWidth: CONTENT_MAX_WIDTH }}>
      {/* Page Title */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={PAGE_TITLE_SX}>
          Overview
        </Typography>
        <Typography variant="body2" sx={PAGE_SUBTITLE_SX}>
          Manage, deploy, and observe your AI agents and tools.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Row */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 2.5,
          mb: 3,
        }}
      >
        {statCards.map(card => (
          <Card
            key={card.label}
            variant="outlined"
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              bgcolor: 'background.paper',
              border: subtleBorder(theme),
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="caption" sx={SECTION_LABEL_SX}>
                {card.label}
              </Typography>
              <Box sx={{ color: theme.palette.text.disabled }}>{card.icon}</Box>
            </Box>
            {loading ? (
              <Skeleton variant="text" width={60} height={48} />
            ) : (
              <Typography
                sx={{
                  fontWeight: 800,
                  lineHeight: 1,
                  fontSize: '2rem',
                  color: 'text.primary',
                }}
              >
                {card.value}
              </Typography>
            )}
          </Card>
        ))}
      </Box>

      {/* Getting Started */}
      <Collapse in={showGettingStarted}>
        <Card
          variant="outlined"
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            bgcolor: 'background.paper',
            border: subtleBorder(theme),
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <RocketLaunchIcon
                sx={{ fontSize: 22, color: theme.palette.text.secondary }}
              />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: 'text.primary',
                }}
              >
                Getting Started
              </Typography>
            </Box>
            <IconButton size="small" onClick={dismissGettingStarted}>
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 2.5,
            }}
          >
            {gettingStartedSteps.map(step => (
              <Box
                key={step.step}
                sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(
                      theme.palette.text.primary,
                      isDark ? 0.1 : 0.06,
                    ),
                    color: theme.palette.text.secondary,
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    flexShrink: 0,
                  }}
                >
                  {step.step}
                </Box>
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      mb: 0.25,
                      color: 'text.primary',
                    }}
                  >
                    {step.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    {step.description}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Card>
      </Collapse>

      {/* Quick Actions */}
      <Typography
        variant="h6"
        sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}
      >
        Quick Actions
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
          },
          gap: 2,
          mb: 3,
        }}
      >
        {createActions.map(action => (
          <Card
            key={action.label}
            variant="outlined"
            sx={{
              transition: HOVER_TRANSITION,
              border: subtleBorder(theme),
              '&:hover': {
                borderColor: theme.palette.text.disabled,
              },
            }}
          >
            <CardActionArea
              onClick={() =>
                action.action ? action.action() : onNavigate(action.panel)
              }
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(
                    theme.palette.text.primary,
                    isDark ? 0.08 : 0.05,
                  ),
                  color: theme.palette.text.secondary,
                  flexShrink: 0,
                }}
              >
                {action.icon}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: 'text.primary',
                  }}
                >
                  {action.label}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: theme.palette.text.secondary }}
                >
                  {action.description}
                </Typography>
              </Box>
              <ArrowForwardIcon
                sx={{
                  fontSize: 16,
                  color: theme.palette.text.disabled,
                  flexShrink: 0,
                }}
              />
            </CardActionArea>
          </Card>
        ))}
      </Box>

      {/* Agent & Tool Health + Recent Builds (tabbed) */}
      <Box sx={{ ...tableContainerSx(theme), overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={(_e, v) => setActiveTab(v)}
          sx={{
            minHeight: 40,
            borderBottom: 1,
            borderColor: 'divider',
            px: 2,
            '& .MuiTab-root': {
              minHeight: 40,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
            },
          }}
        >
          <Tab label="Agent & Tool Health" />
          <Tab label="Recent Builds" />
        </Tabs>
        {activeTab === 0 && renderHealthContent()}
        {activeTab === 1 && renderBuildsContent()}
      </Box>
    </Box>
  );
}

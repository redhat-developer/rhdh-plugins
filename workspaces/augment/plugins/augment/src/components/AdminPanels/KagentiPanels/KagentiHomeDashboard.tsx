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

import { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import { useTheme, alpha } from '@mui/material/styles';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import HandymanOutlinedIcon from '@mui/icons-material/HandymanOutlined';
import WorkspacesOutlinedIcon from '@mui/icons-material/WorkspacesOutlined';
import NoteAddOutlinedIcon from '@mui/icons-material/NoteAddOutlined';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import SettingsSuggestOutlinedIcon from '@mui/icons-material/SettingsSuggestOutlined';
import InsightsIcon from '@mui/icons-material/Insights';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { useApi } from '@backstage/core-plugin-api';
import { augmentApiRef } from '../../../api';
import type { AdminPanel } from '../../../hooks';

export interface KagentiHomeDashboardProps {
  namespace?: string;
  onNavigate: (panel: AdminPanel) => void;
}

interface DashboardStats {
  totalAgents: number;
  readyAgents: number;
  totalTools: number;
  readyTools: number;
  namespaceCount: number;
}

const GETTING_STARTED_KEY = 'augment:kagenti-getting-started-dismissed';

export function KagentiHomeDashboard({
  namespace,
  onNavigate,
}: KagentiHomeDashboardProps) {
  const theme = useTheme();
  const api = useApi(augmentApiRef);
  const isDark = theme.palette.mode === 'dark';

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGettingStarted, setShowGettingStarted] = useState(() => {
    try {
      return !localStorage.getItem(GETTING_STARTED_KEY);
    } catch {
      return true;
    }
  });

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [agentsRes, toolsRes, nsRes] = await Promise.all([
        api.listKagentiAgents(namespace || undefined),
        api.listKagentiTools(namespace || undefined),
        api.listKagentiNamespaces(),
      ]);
      const agents = agentsRes.agents ?? [];
      const tools = toolsRes.tools ?? [];
      setStats({
        totalAgents: agents.length,
        readyAgents: agents.filter(a => a.status?.toLowerCase() === 'ready')
          .length,
        totalTools: tools.length,
        readyTools: tools.filter(t => t.status?.toLowerCase() === 'ready')
          .length,
        namespaceCount: nsRes.namespaces?.length ?? 0,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [api, namespace]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const dismissGettingStarted = () => {
    setShowGettingStarted(false);
    try {
      localStorage.setItem(GETTING_STARTED_KEY, '1');
    } catch {
      /* noop */
    }
  };

  const statCards = [
    {
      label: 'Total Agents',
      value: stats?.totalAgents ?? 0,
      icon: <HubOutlinedIcon />,
      accent: theme.palette.primary.main,
    },
    {
      label: 'Ready Agents',
      value: stats?.readyAgents ?? 0,
      icon: <TaskAltIcon />,
      accent: theme.palette.success.main,
    },
    {
      label: 'Ready Tools',
      value: stats?.readyTools ?? 0,
      icon: <HandymanOutlinedIcon />,
      accent: theme.palette.info.main,
    },
    {
      label: 'Workspaces',
      value: stats?.namespaceCount ?? 0,
      icon: <WorkspacesOutlinedIcon />,
      accent: theme.palette.warning.main,
    },
  ];

  const createActions: Array<{
    label: string;
    description: string;
    icon: React.ReactNode;
    accent: string;
    panel: AdminPanel;
  }> = [
    {
      label: 'Create Agent',
      description: 'Import or build a new AI agent',
      icon: <NoteAddOutlinedIcon sx={{ fontSize: 24 }} />,
      accent: theme.palette.primary.main,
      panel: 'kagenti-agents' as AdminPanel,
    },
    {
      label: 'Create Tool',
      description: 'Register an MCP tool server',
      icon: <ExtensionOutlinedIcon sx={{ fontSize: 24 }} />,
      accent: theme.palette.info.main,
      panel: 'kagenti-tools' as AdminPanel,
    },
  ];

  type NavAction = {
    label: string;
    description: string;
    icon: React.ReactNode;
    accent: string;
    panel: AdminPanel;
  };

  const workloadActions: NavAction[] = [
    {
      label: 'Agents',
      description: 'View and manage agents',
      icon: <HubOutlinedIcon sx={{ fontSize: 24 }} />,
      accent: theme.palette.primary.main,
      panel: 'kagenti-agents' as AdminPanel,
    },
    {
      label: 'Tools',
      description: 'View and manage tools',
      icon: <HandymanOutlinedIcon sx={{ fontSize: 24 }} />,
      accent: theme.palette.info.main,
      panel: 'kagenti-tools' as AdminPanel,
    },
    {
      label: 'Build Pipelines',
      description: 'Shipwright builds and strategies',
      icon: <AccountTreeOutlinedIcon sx={{ fontSize: 24 }} />,
      accent: theme.palette.warning.main,
      panel: 'kagenti-builds' as AdminPanel,
    },
    {
      label: 'Sandbox',
      description: 'Sessions, pods, and token usage',
      icon: <ScienceOutlinedIcon sx={{ fontSize: 24 }} />,
      accent: theme.palette.secondary.main,
      panel: 'kagenti-sandbox' as AdminPanel,
    },
  ];

  const operationsActions: NavAction[] = [
    {
      label: 'Platform Config',
      description: 'Model, RAG, MCP, and safety',
      icon: <SettingsSuggestOutlinedIcon sx={{ fontSize: 24 }} />,
      accent: '#009688',
      panel: 'kagenti-platform' as AdminPanel,
    },
    {
      label: 'Observability',
      description: 'Traces, network, dashboards',
      icon: <InsightsIcon sx={{ fontSize: 24 }} />,
      accent: theme.palette.success.main,
      panel: 'kagenti-dashboards' as AdminPanel,
    },
    {
      label: 'Administration',
      description: 'Identity, namespaces, migration',
      icon: <ManageAccountsOutlinedIcon sx={{ fontSize: 24 }} />,
      accent: theme.palette.text.secondary,
      panel: 'kagenti-admin' as AdminPanel,
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

  return (
    <Box sx={{ maxWidth: 1200 }}>
      {/* Page Title */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.75 }}>
          Command Center
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{ color: theme.palette.text.secondary, fontWeight: 400 }}
        >
          Manage, deploy, and observe your AI agents and tools with ease.
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
          mb: 4,
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
              bgcolor: alpha(theme.palette.background.paper, isDark ? 0.5 : 1),
              borderLeft: `3px solid ${alpha(card.accent, isDark ? 0.6 : 0.5)}`,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontSize: '0.75rem',
                }}
              >
                {card.label}
              </Typography>
              <Box sx={{ color: alpha(card.accent, 0.7) }}>{card.icon}</Box>
            </Box>
            {loading ? (
              <Skeleton variant="text" width={60} height={48} />
            ) : (
              <Typography
                sx={{ fontWeight: 800, lineHeight: 1, fontSize: '2rem' }}
              >
                {card.value}
              </Typography>
            )}
          </Card>
        ))}
      </Box>

      {/* Quick Actions */}
      <Typography
        variant="h6"
        sx={{ fontWeight: 700, mb: 2, letterSpacing: '0.01em' }}
      >
        Quick Actions
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: 2,
          mb: 5,
        }}
      >
        {createActions.map(action => (
          <Card
            key={action.label}
            variant="outlined"
            sx={{
              borderLeft: `3px solid ${alpha(action.accent, isDark ? 0.5 : 0.4)}`,
              transition:
                'border-color 0.2s, box-shadow 0.2s, background-color 0.2s, transform 0.2s',
              '&:hover': {
                borderColor: action.accent,
                bgcolor: alpha(action.accent, isDark ? 0.06 : 0.02),
                boxShadow: `0 4px 16px ${alpha(action.accent, isDark ? 0.12 : 0.08)}`,
                transform: 'translateY(-1px)',
              },
            }}
          >
            <CardActionArea
              onClick={() => onNavigate(action.panel)}
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
                  bgcolor: alpha(action.accent, isDark ? 0.15 : 0.08),
                  color: action.accent,
                  flexShrink: 0,
                }}
              >
                {action.icon}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, fontSize: '0.85rem' }}
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

      {/* Agentic Workloads */}
      <Typography
        variant="h6"
        sx={{ fontWeight: 700, mb: 0.5, letterSpacing: '0.01em' }}
      >
        Navigate
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: theme.palette.text.secondary,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontSize: '0.65rem',
          mb: 2,
          display: 'block',
        }}
      >
        Agentic Workloads
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr 1fr',
            sm: 'repeat(4, 1fr)',
          },
          gap: 2,
          mb: 3,
        }}
      >
        {workloadActions.map(action => (
          <Card
            key={action.label}
            variant="outlined"
            sx={{
              borderRadius: 2,
              transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
              '&:hover': {
                borderColor: action.accent,
                boxShadow: `0 4px 16px ${alpha(action.accent, isDark ? 0.15 : 0.08)}`,
                transform: 'translateY(-1px)',
              },
            }}
          >
            <CardActionArea
              onClick={() => onNavigate(action.panel)}
              sx={{
                p: 2.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(action.accent, isDark ? 0.15 : 0.08),
                  color: action.accent,
                }}
              >
                {action.icon}
              </Box>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, fontSize: '0.875rem' }}
                >
                  {action.label}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: '0.75rem',
                    mt: 0.25,
                  }}
                >
                  {action.description}
                </Typography>
              </Box>
            </CardActionArea>
          </Card>
        ))}
      </Box>

      {/* Operations */}
      <Typography
        variant="caption"
        sx={{
          color: theme.palette.text.secondary,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontSize: '0.65rem',
          mb: 2,
          display: 'block',
        }}
      >
        Operations
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr 1fr',
            sm: 'repeat(3, 1fr)',
          },
          gap: 2,
          mb: 4,
        }}
      >
        {operationsActions.map(action => (
          <Card
            key={action.label}
            variant="outlined"
            sx={{
              borderRadius: 2,
              transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
              '&:hover': {
                borderColor: action.accent,
                boxShadow: `0 4px 16px ${alpha(action.accent, isDark ? 0.15 : 0.08)}`,
                transform: 'translateY(-1px)',
              },
            }}
          >
            <CardActionArea
              onClick={() => onNavigate(action.panel)}
              sx={{
                p: 2.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(action.accent, isDark ? 0.15 : 0.08),
                  color: action.accent,
                }}
              >
                {action.icon}
              </Box>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, fontSize: '0.875rem' }}
                >
                  {action.label}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: '0.75rem',
                    mt: 0.25,
                  }}
                >
                  {action.description}
                </Typography>
              </Box>
            </CardActionArea>
          </Card>
        ))}
      </Box>

      {/* Getting Started */}
      <Collapse in={showGettingStarted}>
        <Card
          variant="outlined"
          sx={{
            p: 3,
            mb: 2,
            borderRadius: 2,
            background: isDark
              ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.15)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`
              : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${theme.palette.background.paper} 100%)`,
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
                sx={{ fontSize: 22, color: theme.palette.primary.main }}
              />
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, fontSize: '1rem' }}
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
                      theme.palette.primary.main,
                      isDark ? 0.2 : 0.1,
                    ),
                    color: theme.palette.primary.main,
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    flexShrink: 0,
                  }}
                >
                  {step.step}
                </Box>
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 0.25 }}
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
    </Box>
  );
}

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

import { useState, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import { useTheme, alpha } from '@mui/material/styles';
import HomeIcon from '@mui/icons-material/Home';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import BuildIcon from '@mui/icons-material/Build';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import ScienceIcon from '@mui/icons-material/Science';
import TuneIcon from '@mui/icons-material/Tune';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { AdminPanel } from '../../hooks';
import { useTranslation } from '../../hooks/useTranslation';
import { NamespacePicker } from '../AdminPanels/KagentiPanels';

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 56;

interface NavItem {
  id: AdminPanel;
  label: string;
  icon: React.ReactNode;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export interface KagentiSidebarProps {
  adminPanel: AdminPanel;
  onAdminPanelChange: (panel: AdminPanel) => void;
  onBackToChat: () => void;
  kagentiNamespace?: string;
  onKagentiNamespaceChange?: (ns: string) => void;
}

export function KagentiSidebar({
  adminPanel,
  onAdminPanelChange,
  onBackToChat,
  kagentiNamespace,
  onKagentiNamespaceChange,
}: KagentiSidebarProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const isDark = theme.palette.mode === 'dark';
  const [collapsed, setCollapsed] = useState(false);
  const width = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  const navGroups = useMemo<NavGroup[]>(
    () => [
      {
        title: '',
        items: [
          {
            id: 'kagenti-home' as AdminPanel,
            label: t('commandCenter.home'),
            icon: <HomeIcon sx={{ fontSize: 20 }} />,
          },
        ],
      },
      {
        title: 'Agentic Workloads',
        items: [
          {
            id: 'kagenti-agents' as AdminPanel,
            label: t('commandCenter.agentCatalog'),
            icon: <SmartToyIcon sx={{ fontSize: 20 }} />,
          },
          {
            id: 'kagenti-tools' as AdminPanel,
            label: t('commandCenter.toolCatalog'),
            icon: <BuildIcon sx={{ fontSize: 20 }} />,
          },
          {
            id: 'kagenti-builds' as AdminPanel,
            label: 'Build Pipelines',
            icon: <RocketLaunchIcon sx={{ fontSize: 20 }} />,
          },
          {
            id: 'kagenti-sandbox' as AdminPanel,
            label: 'Sandbox',
            icon: <ScienceIcon sx={{ fontSize: 20 }} />,
          },
        ],
      },
      {
        title: 'Operations',
        items: [
          {
            id: 'kagenti-platform' as AdminPanel,
            label: 'Platform Config',
            icon: <TuneIcon sx={{ fontSize: 20 }} />,
          },
          {
            id: 'kagenti-dashboards' as AdminPanel,
            label: t('commandCenter.observability'),
            icon: <MonitorHeartIcon sx={{ fontSize: 20 }} />,
          },
          {
            id: 'kagenti-admin' as AdminPanel,
            label: t('commandCenter.administration'),
            icon: <AdminPanelSettingsOutlinedIcon sx={{ fontSize: 20 }} />,
          },
        ],
      },
    ],
    [t],
  );

  const handleNavClick = useCallback(
    (panel: AdminPanel) => {
      onAdminPanelChange(panel);
    },
    [onAdminPanelChange],
  );

  return (
    <Box
      sx={{
        width,
        minWidth: width,
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid ${theme.palette.divider}`,
        background: isDark
          ? alpha(theme.palette.background.paper, 0.6)
          : alpha(theme.palette.background.paper, 0.95),
        transition: 'width 0.2s ease',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Sidebar Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: collapsed ? 1 : 2,
          py: 1.5,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          minHeight: 52,
        }}
      >
        {!collapsed && (
          <Typography
            variant="subtitle2"
            noWrap
            sx={{
              fontWeight: 700,
              flex: 1,
              fontSize: '0.875rem',
              color: theme.palette.text.primary,
            }}
          >
            {t('commandCenter.title')}
          </Typography>
        )}
        <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <IconButton
            size="small"
            onClick={() => setCollapsed(c => !c)}
            sx={{ ml: collapsed ? 'auto' : 0, mr: collapsed ? 'auto' : 0 }}
          >
            {collapsed ? (
              <ChevronRightIcon sx={{ fontSize: 18 }} />
            ) : (
              <ChevronLeftIcon sx={{ fontSize: 18 }} />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Namespace Picker */}
      {onKagentiNamespaceChange && !collapsed && (
        <Box
          sx={{
            px: 1.5,
            py: 1,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          }}
        >
          <NamespacePicker
            value={kagentiNamespace || ''}
            onChange={onKagentiNamespaceChange}
            size="small"
            fullWidth
            variant="minimal"
          />
        </Box>
      )}

      {/* Navigation Groups */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          py: 1,
        }}
      >
        {navGroups.map((group, groupIdx) => (
          <Box key={group.title}>
            {groupIdx > 0 && groupIdx === navGroups.length - 1 && (
              <Box
                sx={{
                  mx: collapsed ? 0.5 : 1.5,
                  my: 1,
                  borderTop: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
                }}
              />
            )}

            {!collapsed && group.title && (
              <Typography
                variant="overline"
                noWrap
                sx={{
                  display: 'block',
                  px: 2,
                  pt: groupIdx === 0 ? 0.5 : 1.5,
                  pb: 0.5,
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  color: alpha(theme.palette.text.secondary, 0.7),
                  letterSpacing: '0.08em',
                  lineHeight: 1.4,
                }}
              >
                {group.title}
              </Typography>
            )}

            {group.items.map(item => {
              const isActive = adminPanel === item.id;
              const btn = (
                <Box
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleNavClick(item.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNavClick(item.id);
                    }
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: collapsed ? 0 : 2,
                    py: 0.75,
                    mx: collapsed ? 0.5 : 0.75,
                    borderRadius: 1,
                    cursor: 'pointer',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    position: 'relative',
                    color: isActive
                      ? theme.palette.primary.main
                      : theme.palette.text.secondary,
                    bgcolor: isActive
                      ? alpha(theme.palette.primary.main, isDark ? 0.15 : 0.08)
                      : 'transparent',
                    fontWeight: isActive ? 600 : 400,
                    '&:hover': {
                      bgcolor: isActive
                        ? alpha(theme.palette.primary.main, isDark ? 0.2 : 0.12)
                        : alpha(theme.palette.action.hover, 0.5),
                    },
                    '&::before': isActive
                      ? {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: 4,
                          bottom: 4,
                          width: 3,
                          borderRadius: '0 2px 2px 0',
                          bgcolor: theme.palette.primary.main,
                        }
                      : {},
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </Box>
                  {!collapsed && (
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{
                        fontSize: '0.8125rem',
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >
                      {item.label}
                    </Typography>
                  )}
                </Box>
              );

              return collapsed ? (
                <Tooltip key={item.id} title={item.label} placement="right">
                  {btn}
                </Tooltip>
              ) : (
                btn
              );
            })}
          </Box>
        ))}
      </Box>

      {/* Back to Chat */}
      <Box
        sx={{
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          p: collapsed ? 0.5 : 1.5,
          display: 'flex',
          justifyContent: collapsed ? 'center' : 'stretch',
        }}
      >
        {collapsed ? (
          <Tooltip title={t('commandCenter.backToChat')} placement="right">
            <IconButton size="small" onClick={onBackToChat}>
              <ArrowBackIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        ) : (
          <Button
            fullWidth
            size="small"
            variant="outlined"
            startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
            onClick={onBackToChat}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.8125rem',
              borderColor: alpha(theme.palette.divider, 0.6),
              color: theme.palette.text.secondary,
              '&:hover': {
                color: theme.palette.text.primary,
                borderColor: theme.palette.text.secondary,
              },
            }}
          >
            {t('commandCenter.backToChat')}
          </Button>
        )}
      </Box>
    </Box>
  );
}

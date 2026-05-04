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

import { useState, useCallback, useMemo, Fragment, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import Fade from '@mui/material/Fade';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme, alpha } from '@mui/material/styles';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { typeScale, iconSize, glassSurface, transitions } from '../../theme/tokens';
import type { AdminPanel } from '../../hooks';

const SIDEBAR_WIDTH = 220;
const SIDEBAR_COLLAPSED_WIDTH = 52;

export interface NavItem {
  id: AdminPanel;
  label: string;
  icon: ReactNode;
  description?: string;
  tourId?: string;
  /** Only show for these personas. Omit for 'all'. */
  persona?: 'developer' | 'ops';
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export interface PrimarySidebarProps {
  activePanel: AdminPanel;
  onNavigate: (panel: AdminPanel) => void;
  onBackToChat: () => void;
  groups: NavGroup[];
  title?: string;
  /** Slot for a context picker (e.g., namespace selector) shown below the header */
  contextPicker?: ReactNode;
}

/**
 * Unified primary navigation sidebar.
 * Vendor-agnostic, persona-aware, and responsive (mobile drawer).
 */
export function PrimarySidebar({
  activePanel,
  onNavigate,
  onBackToChat,
  groups,
  title = 'Command Center',
  contextPicker,
}: PrimarySidebarProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const effectiveCollapsed = isMobile ? false : collapsed;
  const width = effectiveCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  const handleNavClick = useCallback(
    (panel: AdminPanel) => {
      onNavigate(panel);
      if (isMobile) setMobileOpen(false);
    },
    [onNavigate, isMobile],
  );

  const glass = useMemo(() => glassSurface(theme, 8, isDark ? 0.65 : 0.85), [theme, isDark]);

  const sidebarContent = (
    <Box
      component="nav"
      aria-label="Primary navigation"
      sx={{
        width: isMobile ? SIDEBAR_WIDTH : width,
        minWidth: isMobile ? SIDEBAR_WIDTH : width,
        display: 'flex',
        flexDirection: 'column',
        borderRight: isMobile ? 'none' : `1px solid ${alpha(theme.palette.divider, isDark ? 0.2 : 0.12)}`,
        ...glass,
        transition: `width 0.2s ease, min-width 0.2s ease`,
        overflow: 'hidden',
        flexShrink: 0,
        height: '100%',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: effectiveCollapsed ? 0.5 : 2,
          py: 1.5,
          borderBottom: `1px solid ${alpha(theme.palette.divider, isDark ? 0.2 : 0.1)}`,
          minHeight: 52,
          justifyContent: effectiveCollapsed ? 'center' : 'flex-start',
        }}
      >
        {!effectiveCollapsed && (
          <Typography
            variant="subtitle2"
            noWrap
            sx={{
              fontWeight: 700,
              flex: 1,
              fontSize: typeScale.body.fontSize,
              color: theme.palette.text.primary,
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </Typography>
        )}
        <Tooltip title={effectiveCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <IconButton
            size="small"
            onClick={() => setCollapsed(c => !c)}
            aria-label={effectiveCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            sx={{ ml: effectiveCollapsed ? 'auto' : 0, mr: effectiveCollapsed ? 'auto' : 0 }}
          >
            {effectiveCollapsed ? (
              <ChevronRightIcon sx={{ fontSize: iconSize.md }} />
            ) : (
              <ChevronLeftIcon sx={{ fontSize: iconSize.md }} />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Context picker slot (e.g. namespace selector) */}
      {contextPicker && !effectiveCollapsed && (
        <Box
          sx={{
            px: 1.5,
            py: 1,
            borderBottom: `1px solid ${alpha(theme.palette.divider, isDark ? 0.15 : 0.08)}`,
          }}
        >
          {contextPicker}
        </Box>
      )}

      {/* Navigation Groups */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          py: 1,
          scrollbarWidth: 'thin',
          scrollbarColor: `${alpha(theme.palette.text.primary, 0.15)} transparent`,
        }}
      >
        {groups.map((group, groupIdx) => (
          <Box key={group.title || `group-${groupIdx}`}>
            {groupIdx > 0 && (
              <Box
                sx={{
                  mx: effectiveCollapsed ? 0.5 : 1.5,
                  my: 1,
                  borderTop: `1px solid ${alpha(theme.palette.divider, isDark ? 0.2 : 0.1)}`,
                }}
              />
            )}

            {!effectiveCollapsed && group.title && (
              <Typography
                variant="overline"
                noWrap
                sx={{
                  display: 'block',
                  px: 2,
                  pt: groupIdx === 0 ? 0.5 : 1.5,
                  pb: 0.5,
                  fontSize: typeScale.caption.fontSize,
                  fontWeight: 600,
                  color: alpha(theme.palette.text.secondary, 0.8),
                  letterSpacing: '0.05em',
                  lineHeight: 1.4,
                }}
              >
                {group.title}
              </Typography>
            )}

            {group.items.map(item => {
              const isActive = activePanel === item.id;
              const btn = (
                <Box
                  data-tour={item.tourId}
                  role="button"
                  tabIndex={0}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={item.label}
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
                    px: effectiveCollapsed ? 0 : 2,
                    py: 0.75,
                    mx: effectiveCollapsed ? 0.5 : 0.75,
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    justifyContent: effectiveCollapsed ? 'center' : 'flex-start',
                    color: isActive
                      ? theme.palette.primary.main
                      : theme.palette.text.secondary,
                    bgcolor: isActive
                      ? alpha(theme.palette.primary.main, isDark ? 0.12 : 0.08)
                      : 'transparent',
                    fontWeight: isActive ? 600 : 400,
                    transition: transitions.fast,
                    '&:hover': {
                      bgcolor: isActive
                        ? alpha(theme.palette.primary.main, isDark ? 0.16 : 0.1)
                        : alpha(theme.palette.action.hover, 0.6),
                      color: isActive
                        ? theme.palette.primary.main
                        : theme.palette.text.primary,
                    },
                    '&:focus-visible': {
                      outline: `2px solid ${theme.palette.primary.main}`,
                      outlineOffset: -2,
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      flexShrink: 0,
                      color: 'inherit',
                    }}
                  >
                    {item.icon}
                  </Box>
                  {!effectiveCollapsed && (
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{
                        fontSize: typeScale.body.fontSize,
                        fontWeight: 'inherit',
                        color: 'inherit',
                      }}
                    >
                      {item.label}
                    </Typography>
                  )}
                </Box>
              );

              if (effectiveCollapsed) {
                return (
                  <Tooltip key={item.id} title={item.label} placement="right" arrow>
                    {btn}
                  </Tooltip>
                );
              }
              if (item.description) {
                return (
                  <Tooltip
                    key={item.id}
                    title={item.description}
                    placement="right"
                    arrow
                    enterDelay={600}
                    TransitionComponent={Fade}
                    TransitionProps={{ timeout: 200 }}
                  >
                    {btn}
                  </Tooltip>
                );
              }
              return <Fragment key={item.id}>{btn}</Fragment>;
            })}
          </Box>
        ))}
      </Box>

      {/* Back to Marketplace footer */}
      <Box
        data-tour="back-to-marketplace"
        sx={{
          borderTop: `1px solid ${alpha(theme.palette.divider, isDark ? 0.2 : 0.1)}`,
          p: effectiveCollapsed ? 0.5 : 1.5,
          display: 'flex',
          justifyContent: effectiveCollapsed ? 'center' : 'stretch',
        }}
      >
        {effectiveCollapsed ? (
          <Tooltip title="Marketplace" placement="right">
            <IconButton size="small" onClick={onBackToChat}>
              <ChatBubbleOutlineIcon sx={{ fontSize: iconSize.md }} />
            </IconButton>
          </Tooltip>
        ) : (
          <Button
            fullWidth
            size="small"
            variant="outlined"
            startIcon={<ChatBubbleOutlineIcon sx={{ fontSize: iconSize.sm }} />}
            onClick={onBackToChat}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              fontSize: typeScale.body.fontSize,
              borderRadius: 1.5,
              borderColor: alpha(theme.palette.divider, isDark ? 0.3 : 0.2),
              color: theme.palette.text.secondary,
              transition: transitions.fast,
              '&:hover': {
                color: theme.palette.primary.main,
                borderColor: alpha(theme.palette.primary.main, 0.4),
                bgcolor: alpha(theme.palette.primary.main, isDark ? 0.08 : 0.04),
              },
            }}
          >
            Marketplace
          </Button>
        )}
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <>
        <IconButton
          onClick={() => setMobileOpen(true)}
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 10,
            display: { xs: 'inline-flex', md: 'none' },
          }}
          aria-label="Open navigation"
        >
          <ChevronRightIcon />
        </IconButton>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH },
          }}
        >
          {sidebarContent}
        </Drawer>
      </>
    );
  }

  return sidebarContent;
}

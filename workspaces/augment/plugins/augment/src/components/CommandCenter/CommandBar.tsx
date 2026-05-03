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

import { type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import { useTheme, alpha } from '@mui/material/styles';
import type { AdminPanel } from '../../hooks';

interface CommandBarItem {
  id: AdminPanel;
  label: string;
  badge?: number;
  badgeColor?: string;
}

interface CommandBarProps {
  items: CommandBarItem[];
  activePanel: AdminPanel;
  onNavigate: (panel: AdminPanel) => void;
  onBackToMarketplace: () => void;
  contextPicker?: ReactNode;
}

/**
 * Top command bar replacing the sidebar.
 * 48px glass strip -- section pills, badges, namespace picker, marketplace exit.
 * Gives 100% horizontal space to content below.
 */
export function CommandBar({
  items,
  activePanel,
  onNavigate,
  onBackToMarketplace,
  contextPicker,
}: CommandBarProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        height: 48,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        px: 2,
        borderBottom: `1px solid ${alpha(theme.palette.divider, isDark ? 0.15 : 0.08)}`,
        bgcolor: isDark
          ? alpha(theme.palette.background.paper, 0.7)
          : alpha(theme.palette.background.paper, 0.9),
        backdropFilter: 'blur(16px) saturate(150%)',
        WebkitBackdropFilter: 'blur(16px) saturate(150%)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        flexShrink: 0,
      }}
    >
      {/* Title */}
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          fontSize: '0.7rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: theme.palette.text.secondary,
          mr: 2,
          whiteSpace: 'nowrap',
        }}
      >
        Command Center
      </Typography>

      {/* Section Pills */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.25,
          flex: 1,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {items.map(item => {
          const isActive = activePanel === item.id;
          return (
            <Box
              key={item.id}
              role="tab"
              tabIndex={0}
              aria-selected={isActive}
              onClick={() => onNavigate(item.id)}
              onKeyDown={e => { if (e.key === 'Enter') onNavigate(item.id); }}
              sx={{
                px: 1.5,
                py: 0.6,
                borderRadius: 1.5,
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                bgcolor: isActive ? alpha(theme.palette.primary.main, isDark ? 0.12 : 0.06) : 'transparent',
                position: 'relative',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: isActive
                    ? alpha(theme.palette.primary.main, isDark ? 0.15 : 0.08)
                    : alpha(theme.palette.action.hover, 0.5),
                  color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
                },
                // Glowing underline for active
                '&::after': isActive ? {
                  content: '""',
                  position: 'absolute',
                  bottom: -1,
                  left: '20%',
                  right: '20%',
                  height: 2,
                  borderRadius: 1,
                  bgcolor: theme.palette.primary.main,
                  boxShadow: `0 0 8px ${alpha(theme.palette.primary.main, 0.6)}`,
                } : {},
              }}
            >
              {item.label}
              {item.badge && item.badge > 0 && (
                <Box
                  component="span"
                  sx={{
                    ml: 0.75,
                    px: 0.6,
                    py: 0.1,
                    borderRadius: 1,
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    bgcolor: alpha(item.badgeColor || theme.palette.warning.main, isDark ? 0.2 : 0.12),
                    color: item.badgeColor || theme.palette.warning.main,
                    lineHeight: 1.3,
                  }}
                >
                  {item.badge}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      {/* Right: namespace picker + marketplace */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 1, flexShrink: 0 }}>
        {contextPicker && (
          <Box sx={{ maxWidth: 160 }}>
            {contextPicker}
          </Box>
        )}
        <Tooltip title="Back to Marketplace">
          <Button
            size="small"
            variant="text"
            startIcon={<StorefrontOutlinedIcon sx={{ fontSize: 16 }} />}
            onClick={onBackToMarketplace}
            sx={{
              textTransform: 'none',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: theme.palette.text.secondary,
              px: 1.5,
              minWidth: 'auto',
              '&:hover': { color: theme.palette.primary.main },
            }}
          >
            Marketplace
          </Button>
        </Tooltip>
      </Box>
    </Box>
  );
}

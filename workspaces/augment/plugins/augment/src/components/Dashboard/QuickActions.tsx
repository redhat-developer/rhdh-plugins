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

import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme, alpha } from '@mui/material/styles';
import { borderRadius, transitions, typeScale } from '../../theme/tokens';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
  title?: string;
}

/**
 * A grid of quick-action cards for the home dashboard.
 */
export function QuickActions({ actions, title = 'Quick Actions' }: QuickActionsProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box>
      <Typography
        variant="subtitle2"
        sx={{
          fontSize: typeScale.sectionTitle.fontSize,
          fontWeight: 600,
          mb: 1.5,
          color: theme.palette.text.primary,
        }}
      >
        {title}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 1.5,
        }}
      >
        {actions.map(action => (
          <Box
            key={action.id}
            role="button"
            tabIndex={0}
            onClick={action.onClick}
            onKeyDown={e => { if (e.key === 'Enter') action.onClick(); }}
            sx={{
              p: 2,
              borderRadius: borderRadius.md,
              border: `1px solid ${alpha(theme.palette.divider, isDark ? 0.2 : 0.12)}`,
              bgcolor: alpha(theme.palette.background.paper, isDark ? 0.5 : 0.8),
              cursor: 'pointer',
              transition: transitions.fast,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              '&:hover': {
                borderColor: alpha(theme.palette.primary.main, 0.3),
                bgcolor: alpha(theme.palette.primary.main, isDark ? 0.06 : 0.03),
                transform: 'translateY(-1px)',
              },
              '&:focus-visible': {
                outline: `2px solid ${theme.palette.primary.main}`,
                outlineOffset: -2,
              },
            }}
          >
            <Box
              sx={{
                color: theme.palette.primary.main,
                flexShrink: 0,
                mt: 0.25,
              }}
            >
              {action.icon}
            </Box>
            <Box>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, fontSize: typeScale.body.fontSize }}
              >
                {action.label}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: typeScale.caption.fontSize,
                  lineHeight: 1.4,
                }}
              >
                {action.description}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

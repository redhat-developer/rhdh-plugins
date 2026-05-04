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
import { useTheme } from '@mui/material/styles';
import type { SxProps, Theme } from '@mui/material/styles';
import { glassSurface, glassHoverGlow, transitions, borderRadius } from '../../../theme/tokens';

interface GlassCardProps {
  children: ReactNode;
  /** Enable glow border on hover */
  hover?: boolean;
  /** Custom glow color (defaults to theme primary) */
  glowColor?: string;
  /** Backdrop blur intensity in px */
  blur?: number;
  /** Additional sx overrides */
  sx?: SxProps<Theme>;
  /** Click handler (adds pointer cursor when set) */
  onClick?: () => void;
}

/**
 * A glassmorphism card with translucent background, backdrop blur,
 * and optional hover glow. Theme-aware for light/dark modes.
 */
export const GlassCard = ({
  children,
  hover = false,
  glowColor,
  blur,
  sx,
  onClick,
}: GlassCardProps) => {
  const theme = useTheme();
  const glass = glassSurface(theme, blur);
  const hoverSx = hover || onClick ? glassHoverGlow(theme, glowColor) : {};

  return (
    <Box
      onClick={onClick}
      sx={{
        ...glass,
        borderRadius: borderRadius.md,
        transition: transitions.normal,
        cursor: onClick ? 'pointer' : undefined,
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
        },
        '&:hover': hoverSx,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

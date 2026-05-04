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

import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { alpha, useTheme } from '@mui/material/styles';
import { glassSurface, borderRadius, transitions, typeScale, animations, staggerDelay, reducedMotion } from '../../../theme/tokens';

export interface IntentCard {
  id: string;
  tourId?: string;
  icon: React.ReactElement;
  title: string;
  subtitle: string;
  description: string;
}

export function CardGrid({
  cards,
  onCardClick,
  columns,
}: {
  cards: IntentCard[];
  onCardClick: (id: string) => void;
  columns: number;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 2.5,
      }}
    >
      {cards.map((card, idx) => (
        <ButtonBase
          key={card.id}
          data-tour={card.tourId}
          onClick={() => onCardClick(card.id)}
          sx={{
            ...glassSurface(theme, 6, isDark ? 0.5 : 0.75),
            ...animations.fadeSlideIn,
            animationDelay: staggerDelay(idx, 60),
            animationFillMode: 'both',
            '@media (prefers-reduced-motion: reduce)': reducedMotion,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            textAlign: 'left',
            p: 3,
            borderRadius: borderRadius.lg,
            transition: transitions.normal,
            '&:hover': {
              borderColor: alpha(theme.palette.primary.main, 0.4),
              boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}, 0 8px 24px ${alpha(theme.palette.primary.main, isDark ? 0.15 : 0.08)}`,
              transform: 'translateY(-3px) scale(1.01)',
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
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: borderRadius.md,
              bgcolor: alpha(theme.palette.primary.main, isDark ? 0.15 : 0.08),
              color: theme.palette.primary.main,
              mb: 2,
              '& .MuiSvgIcon-root': { fontSize: 26 },
            }}
          >
            {card.icon}
          </Box>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              mb: 0.5,
              lineHeight: 1.3,
              fontSize: typeScale.sectionTitle.fontSize,
            }}
          >
            {card.title}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.primary.main,
              fontWeight: 600,
              mb: 1,
              fontSize: typeScale.caption.fontSize,
            }}
          >
            {card.subtitle}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ lineHeight: 1.5, fontSize: typeScale.bodySmall.fontSize }}
          >
            {card.description}
          </Typography>
        </ButtonBase>
      ))}
    </Box>
  );
}

export function DialogHeader({
  titleId,
  title,
  subtitle,
  onBack,
}: {
  titleId: string;
  title: string;
  subtitle: string;
  onBack?: () => void;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        px: 3,
        pt: 3,
        pb: 2.5,
        background: isDark
          ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.15)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`
          : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
        borderBottom: `1px solid ${alpha(theme.palette.divider, isDark ? 0.2 : 0.1)}`,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1,
      }}
    >
      {onBack && (
        <IconButton
          onClick={onBack}
          size="small"
          sx={{ mt: 0.25 }}
          aria-label="Back"
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
      )}
      <Box>
        <Typography
          id={titleId}
          variant="h6"
          sx={{ fontWeight: 700, mb: 0.5, fontSize: typeScale.pageTitle.fontSize }}
        >
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: typeScale.bodySmall.fontSize }}>
          {subtitle}
        </Typography>
      </Box>
    </Box>
  );
}

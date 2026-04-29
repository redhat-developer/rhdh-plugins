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

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 2,
      }}
    >
      {cards.map(card => (
        <ButtonBase
          key={card.id}
          data-tour={card.tourId}
          onClick={() => onCardClick(card.id)}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            textAlign: 'left',
            p: 2.5,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper,
            transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.1s',
            '&:hover': {
              borderColor: theme.palette.primary.main,
              boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.25)}, 0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`,
              transform: 'translateY(-1px)',
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: 1.5,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              color: theme.palette.primary.main,
              mb: 1.5,
              '& .MuiSvgIcon-root': { fontSize: 24 },
            }}
          >
            {card.icon}
          </Box>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, mb: 0.25, lineHeight: 1.3 }}
          >
            {card.title}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.primary.main,
              fontWeight: 600,
              mb: 1,
            }}
          >
            {card.subtitle}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ lineHeight: 1.45, fontSize: '0.8125rem' }}
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

  return (
    <Box
      sx={{
        px: 3,
        pt: 3,
        pb: 2,
        background: alpha(theme.palette.primary.main, 0.03),
        borderBottom: `1px solid ${theme.palette.divider}`,
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
          sx={{ fontWeight: 700, mb: 0.5 }}
        >
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </Box>
    </Box>
  );
}

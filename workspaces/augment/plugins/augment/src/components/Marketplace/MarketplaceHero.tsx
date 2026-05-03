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
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { heroSx } from './marketplace.styles';

interface MarketplaceHeroProps {
  isAdmin?: boolean;
  onOpenCommandCenter?: () => void;
}

export function MarketplaceHero({ isAdmin, onOpenCommandCenter }: MarketplaceHeroProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={heroSx(theme, isDark)}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              fontSize: '1.5rem',
              letterSpacing: '-0.02em',
              color: theme.palette.text.primary,
            }}
          >
            Agent Marketplace
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary, mt: 0.5, fontSize: '0.85rem' }}
          >
            Discover and use AI agents built by your team.
          </Typography>
        </Box>
        {isAdmin && onOpenCommandCenter && (
          <Typography
            component="button"
            onClick={onOpenCommandCenter}
            sx={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 500,
              color: theme.palette.text.secondary,
              textDecoration: 'none',
              '&:hover': { color: theme.palette.primary.main, textDecoration: 'underline' },
              p: 0,
            }}
          >
            Command Center
          </Typography>
        )}
      </Box>
    </Box>
  );
}

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
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import SearchIcon from '@mui/icons-material/Search';
import { useTheme, alpha } from '@mui/material/styles';
import { searchBarSx } from './marketplace.styles';

interface MarketplaceSearchProps {
  search: string;
  onSearchChange: (value: string) => void;
  frameworks: string[];
  selectedFramework: string | null;
  onFrameworkChange: (fw: string | null) => void;
  resultCount: number;
}

export function MarketplaceSearch({
  search,
  onSearchChange,
  frameworks,
  selectedFramework,
  onFrameworkChange,
  resultCount,
}: MarketplaceSearchProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={searchBarSx(theme, isDark)}>
      <TextField
        size="small"
        placeholder="Search agents..."
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        sx={{
          minWidth: 160,
          maxWidth: 260,
          '& .MuiOutlinedInput-root': {
            borderRadius: 1.5,
            height: 34,
            fontSize: '0.82rem',
            bgcolor: alpha(theme.palette.background.default, isDark ? 0.3 : 0.7),
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 16, color: theme.palette.text.disabled }} />
            </InputAdornment>
          ),
        }}
      />
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', flex: 1 }}>
        <Chip
          label="All"
          size="small"
          variant={selectedFramework === null ? 'filled' : 'outlined'}
          color={selectedFramework === null ? 'primary' : 'default'}
          onClick={() => onFrameworkChange(null)}
          sx={{ cursor: 'pointer', height: 26, borderRadius: 1.5, fontSize: '0.75rem' }}
        />
        {frameworks.map(fw => (
          <Chip
            key={fw}
            label={fw}
            size="small"
            variant={selectedFramework === fw ? 'filled' : 'outlined'}
            color={selectedFramework === fw ? 'primary' : 'default'}
            onClick={() => onFrameworkChange(fw === selectedFramework ? null : fw)}
            sx={{ cursor: 'pointer', height: 26, borderRadius: 1.5, fontSize: '0.75rem' }}
          />
        ))}
      </Box>
      <Typography variant="caption" sx={{ color: theme.palette.text.disabled, whiteSpace: 'nowrap', fontSize: '0.72rem' }}>
        {resultCount} agent{resultCount !== 1 ? 's' : ''}
      </Typography>
    </Box>
  );
}

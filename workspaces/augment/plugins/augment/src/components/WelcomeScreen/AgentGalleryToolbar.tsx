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
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import HistoryIcon from '@mui/icons-material/History';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useTheme, alpha } from '@mui/material/styles';
import type { FC, SyntheticEvent } from 'react';
import { useTranslation } from '../../hooks/useTranslation';

export type SortOption = 'name' | 'status' | 'newest';

export interface AgentGalleryToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  tab: string;
  onTabChange: (value: string) => void;
  frameworks: string[];
  recentCount: number;
  pinnedCount: number;
  totalCount: number;
  filteredCount: number;
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
  frameworkFilter?: string;
  onFrameworkFilterChange?: (value: string) => void;
}

export const AgentGalleryToolbar: FC<AgentGalleryToolbarProps> = ({
  search,
  onSearchChange,
  tab,
  onTabChange,
  frameworks,
  recentCount,
  pinnedCount,
  totalCount,
  filteredCount,
  sort,
  onSortChange,
  frameworkFilter = '',
  onFrameworkFilterChange,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const handleTabsChange = (_: SyntheticEvent, v: string) => onTabChange(v);

  return (
    <>
      {/* Top row: count badge + filters + search */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 1,
          flexWrap: 'wrap',
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            fontSize: '0.85rem',
          }}
        >
          <Chip
            label={
              filteredCount === totalCount
                ? totalCount
                : `${filteredCount} / ${totalCount}`
            }
            size="small"
            sx={{
              height: 20,
              fontSize: '0.7rem',
              fontWeight: 600,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              '& .MuiChip-label': { px: 0.75 },
            }}
          />
        </Typography>
        <Box sx={{ flex: 1 }} />

        {/* Framework filter dropdown (only when frameworks exist) */}
        {frameworks.length > 0 && onFrameworkFilterChange && (
          <FormControl size="small" sx={{ minWidth: 0 }}>
            <Select
              value={frameworkFilter}
              onChange={e => onFrameworkFilterChange(e.target.value)}
              displayEmpty
              startAdornment={
                <FilterListIcon
                  sx={{
                    fontSize: 14,
                    mr: 0.5,
                    color: theme.palette.text.disabled,
                  }}
                />
              }
              sx={{
                borderRadius: 3,
                fontSize: '0.75rem',
                height: 32,
                '& .MuiSelect-select': { py: 0.5, pl: 0.5 },
                transition: 'all 0.2s ease',
                bgcolor: alpha(
                  theme.palette.background.default,
                  isDark ? 0.4 : 0.5,
                ),
                '&:hover': {
                  bgcolor: alpha(
                    theme.palette.background.default,
                    isDark ? 0.6 : 0.7,
                  ),
                },
              }}
            >
              <MenuItem value="" sx={{ fontSize: '0.8rem' }}>
                All frameworks
              </MenuItem>
              {frameworks.map(fw => (
                <MenuItem key={fw} value={fw} sx={{ fontSize: '0.8rem' }}>
                  {fw}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Sort dropdown */}
        <FormControl size="small" sx={{ minWidth: 0 }}>
          <Select
            value={sort}
            onChange={e => onSortChange(e.target.value as SortOption)}
            displayEmpty
            startAdornment={
              <SortIcon
                sx={{
                  fontSize: 14,
                  mr: 0.5,
                  color: theme.palette.text.disabled,
                }}
              />
            }
            sx={{
              borderRadius: 3,
              fontSize: '0.75rem',
              height: 32,
              '& .MuiSelect-select': { py: 0.5, pl: 0.5 },
              transition: 'all 0.2s ease',
              bgcolor: alpha(
                theme.palette.background.default,
                isDark ? 0.4 : 0.5,
              ),
              '&:hover': {
                bgcolor: alpha(
                  theme.palette.background.default,
                  isDark ? 0.6 : 0.7,
                ),
              },
            }}
          >
            <MenuItem value="name" sx={{ fontSize: '0.8rem' }}>
              Name
            </MenuItem>
            <MenuItem value="status" sx={{ fontSize: '0.8rem' }}>
              Status
            </MenuItem>
            <MenuItem value="newest" sx={{ fontSize: '0.8rem' }}>
              Newest
            </MenuItem>
          </Select>
        </FormControl>

        {/* Search */}
        <TextField
          size="small"
          placeholder={t('agentGallery.searchPlaceholder')}
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          aria-label={t('agentGallery.searchAriaLabel')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon
                  sx={{ fontSize: 16, color: theme.palette.text.disabled }}
                />
              </InputAdornment>
            ),
          }}
          sx={{
            width: 200,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontSize: '0.8rem',
              height: 32,
            },
          }}
        />
      </Box>

      {/* Tabs: All / Recent / Pinned (no framework tabs) */}
      <Tabs
        value={tab}
        onChange={handleTabsChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: 32,
          mb: 1.5,
          '& .MuiTab-root': {
            minHeight: 32,
            textTransform: 'none',
            fontSize: '0.8rem',
            fontWeight: 500,
            minWidth: 'auto',
            px: 1.5,
            py: 0.5,
          },
        }}
      >
        <Tab label={t('agentGallery.tabAll')} value="all" />
        <Tab
          label={t('agentGallery.tabRecent')}
          value="recent"
          icon={<HistoryIcon sx={{ fontSize: 14 }} />}
          iconPosition="start"
          disabled={recentCount === 0}
        />
        <Tab
          label={t('agentGallery.tabPinned')}
          value="pinned"
          icon={<StarIcon sx={{ fontSize: 14 }} />}
          iconPosition="start"
          disabled={pinnedCount === 0}
        />
      </Tabs>
    </>
  );
};

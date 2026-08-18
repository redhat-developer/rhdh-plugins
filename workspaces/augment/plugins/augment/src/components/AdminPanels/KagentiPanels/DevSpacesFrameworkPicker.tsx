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

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import {
  useApi,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';

export interface FrameworkOption {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly starterRepo?: string;
  readonly tags?: string[];
  readonly badge?: string;
}

const DEFAULT_FRAMEWORKS: readonly FrameworkOption[] = [
  {
    id: 'google-adk',
    name: 'Google ADK',
    tags: ['Python', 'A2A'],
    badge: 'Popular',
  },
  {
    id: 'langgraph',
    name: 'LangGraph',
    tags: ['Python', 'Agents'],
    badge: 'Popular',
  },
  { id: 'crewai', name: 'CrewAI', tags: ['Python', 'Multi-Agent'] },
  { id: 'openai-agents', name: 'OpenAI Agents', tags: ['Python', 'OpenAI'] },
  { id: 'custom', name: 'DIY / Custom', tags: ['Any'] },
];

const FRAMEWORK_COLORS: Record<string, string> = {
  'google-adk': '#0d9488',
  langgraph: '#8b5cf6',
  crewai: '#f59e0b',
  'openai-agents': '#10b981',
  custom: '#6b7280',
};

export interface DevSpacesFrameworkPickerProps {
  readonly onSelect: (framework: FrameworkOption) => void;
}

export function DevSpacesFrameworkPicker({
  onSelect,
}: DevSpacesFrameworkPickerProps) {
  const theme = useTheme();
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const [frameworks, setFrameworks] = useState<FrameworkOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    discoveryApi
      .getBaseUrl('augment')
      .then(baseUrl =>
        fetchApi.fetch(`${baseUrl}/devspaces/frameworks`, {
          headers: { 'X-Backstage-Request': 'augment' },
        }),
      )
      .then(resp => resp.json())
      .then((data: { frameworks?: FrameworkOption[] }) => {
        if (!cancelled) {
          const list = data.frameworks?.length
            ? data.frameworks
            : (DEFAULT_FRAMEWORKS as FrameworkOption[]);
          setFrameworks(list);
        }
      })
      .catch(() => {
        if (!cancelled) setFrameworks(DEFAULT_FRAMEWORKS as FrameworkOption[]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [discoveryApi, fetchApi]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 2,
      }}
    >
      {frameworks.map(fw => {
        const isDiy = fw.id === 'custom' || fw.id === 'diy';
        const accent = FRAMEWORK_COLORS[fw.id] ?? theme.palette.primary.main;
        return (
          <Card
            key={fw.id}
            variant="outlined"
            sx={{
              borderRadius: 2.5,
              borderStyle: isDiy ? 'dashed' : 'solid',
              borderColor: alpha(accent, 0.3),
              transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
              '&:hover': {
                borderColor: accent,
                boxShadow: `0 0 0 1px ${alpha(accent, 0.2)}, 0 4px 16px ${alpha(accent, 0.1)}`,
                transform: 'translateY(-2px)',
              },
            }}
          >
            <CardActionArea
              onClick={() => onSelect(fw)}
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'stretch',
                p: 0,
                height: '100%',
              }}
            >
              <Box
                sx={{
                  width: 4,
                  flexShrink: 0,
                  bgcolor: accent,
                  borderTopLeftRadius: 10,
                  borderBottomLeftRadius: 10,
                }}
              />
              <Box sx={{ p: 2, flex: 1, minWidth: 0 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 0.75,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, fontSize: '0.9rem' }}
                  >
                    {fw.name}
                  </Typography>
                  {fw.badge && (
                    <Chip
                      label={fw.badge}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        bgcolor: alpha(accent, 0.12),
                        color: accent,
                        border: 'none',
                      }}
                    />
                  )}
                </Box>
                {fw.description && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: 'block',
                      mb: 1,
                      lineHeight: 1.5,
                      fontSize: '0.78rem',
                    }}
                  >
                    {fw.description}
                  </Typography>
                )}
                {fw.tags && fw.tags.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {fw.tags.map(tag => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          bgcolor: alpha(accent, 0.08),
                          color: accent,
                          fontWeight: 500,
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </CardActionArea>
          </Card>
        );
      })}
    </Box>
  );
}

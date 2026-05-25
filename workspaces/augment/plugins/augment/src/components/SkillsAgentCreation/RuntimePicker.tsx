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
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import {
  useApi,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';

interface SkillRuntime {
  id: string;
  name: string;
  description: string;
  image?: string;
  language?: string;
  footprint?: string;
  features?: string[];
  status: string;
}

export interface RuntimePickerProps {
  readonly onSelect: (runtimeId: string) => void;
  readonly selectedId?: string;
}

export function RuntimePicker({ onSelect, selectedId }: RuntimePickerProps) {
  const theme = useTheme();
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const [runtimes, setRuntimes] = useState<SkillRuntime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    discoveryApi
      .getBaseUrl('augment')
      .then(baseUrl =>
        fetchApi.fetch(`${baseUrl}/skills/runtimes`, {
          headers: { 'X-Backstage-Request': 'augment' },
        }),
      )
      .then(resp => resp.json())
      .then((data: { runtimes?: SkillRuntime[] }) => {
        if (!cancelled) setRuntimes(data.runtimes ?? []);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
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
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" variant="body2">
        Failed to load runtimes: {error}
      </Typography>
    );
  }

  return (
    <Box display="flex" flexWrap="wrap" gap={2}>
      {runtimes.map(rt => {
        const isComingSoon = rt.status === 'coming-soon';
        const isSelected = selectedId === rt.id;

        return (
          <Card
            key={rt.id}
            variant="outlined"
            sx={{
              width: 280,
              opacity: isComingSoon ? 0.5 : 1,
              border: isSelected
                ? `2px solid ${theme.palette.primary.main}`
                : undefined,
            }}
          >
            <CardActionArea
              disabled={isComingSoon}
              onClick={() => onSelect(rt.id)}
              sx={{ height: '100%' }}
            >
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography variant="subtitle1" fontWeight={600}>
                    {rt.name}
                  </Typography>
                  <Chip
                    label={isComingSoon ? 'Coming Soon' : 'Available'}
                    size="small"
                    color={isComingSoon ? 'default' : 'success'}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  {rt.description}
                </Typography>
                {(rt.language || rt.footprint) && (
                  <Typography
                    variant="caption"
                    display="block"
                    color="text.secondary"
                  >
                    {rt.language && `Language: ${rt.language}`}
                    {rt.language && rt.footprint && ' · '}
                    {rt.footprint && `Footprint: ${rt.footprint}`}
                  </Typography>
                )}
                {rt.features && rt.features.length > 0 && (
                  <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                    {rt.features.map(f => (
                      <Chip key={f} label={f} size="small" variant="outlined" />
                    ))}
                  </Box>
                )}
              </CardContent>
            </CardActionArea>
          </Card>
        );
      })}
    </Box>
  );
}

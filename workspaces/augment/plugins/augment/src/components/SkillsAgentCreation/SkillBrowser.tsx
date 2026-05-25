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

import { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
  useApi,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';

interface SkillDefinition {
  name: string;
  description?: string;
  domain?: string;
  gitPath?: string;
}

export interface SkillBrowserProps {
  readonly onSelectionChange: (selectedSkills: string[]) => void;
  readonly selectedSkills: string[];
}

export function SkillBrowser({
  onSelectionChange,
  selectedSkills,
}: SkillBrowserProps) {
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const [skills, setSkills] = useState<SkillDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [search, setSearch] = useState('');
  const [activeDomain, setActiveDomain] = useState(0);

  useEffect(() => {
    let cancelled = false;
    discoveryApi
      .getBaseUrl('augment')
      .then(baseUrl =>
        fetchApi.fetch(`${baseUrl}/skills`, {
          headers: { 'X-Backstage-Request': 'augment' },
        }),
      )
      .then(resp => resp.json())
      .then((data: { skills?: SkillDefinition[] }) => {
        if (!cancelled) setSkills(data.skills ?? []);
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

  const domains = useMemo(() => {
    const set = new Set<string>();
    for (const s of skills) {
      if (s.domain) set.add(s.domain);
    }
    return [
      'All',
      ...Array.from(set).sort((a, b) => a.localeCompare(b, 'en-US')),
    ];
  }, [skills]);

  const filteredSkills = useMemo(() => {
    const domainFilter = domains[activeDomain];
    return skills.filter(s => {
      if (domainFilter !== 'All' && s.domain !== domainFilter) return false;
      if (search) {
        return s.name
          .toLocaleLowerCase('en-US')
          .includes(search.toLocaleLowerCase('en-US'));
      }
      return true;
    });
  }, [skills, activeDomain, domains, search]);

  const handleToggle = (skillId: string) => {
    const next = selectedSkills.includes(skillId)
      ? selectedSkills.filter(id => id !== skillId)
      : [...selectedSkills, skillId];
    onSelectionChange(next);
  };

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
        Failed to load skills: {error}
      </Typography>
    );
  }

  return (
    <Box>
      <TextField
        placeholder="Search skills..."
        size="small"
        fullWidth
        value={search}
        onChange={e => setSearch(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Tabs
        value={activeDomain}
        onChange={(_, v) => setActiveDomain(v as number)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2 }}
      >
        {domains.map(d => (
          <Tab key={d} label={d} />
        ))}
      </Tabs>
      <Box
        sx={{
          maxHeight: 360,
          overflowY: 'auto',
        }}
      >
        {filteredSkills.length === 0 && (
          <Typography variant="body2" color="text.secondary" py={2}>
            No skills match the current filter.
          </Typography>
        )}
        {filteredSkills.map(skill => (
          <Box key={skill.name} px={1} py={0.5}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedSkills.includes(skill.name)}
                  onChange={() => handleToggle(skill.name)}
                  size="small"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    {skill.name}
                  </Typography>
                  {skill.description && (
                    <Typography variant="caption" color="text.secondary">
                      {skill.description}
                    </Typography>
                  )}
                </Box>
              }
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

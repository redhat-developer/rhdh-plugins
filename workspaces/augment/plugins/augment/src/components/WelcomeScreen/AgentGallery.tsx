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

import { useCallback, useMemo, useState, type FC } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useTheme } from '@mui/material/styles';
import { useApi } from '@backstage/core-plugin-api';
import { augmentApiRef } from '../../api';
import type { AgentWithCard } from './agentUtils';
import { sortAgents } from './agentUtils';
import { AgentCard } from './AgentCard';
import { AgentGalleryToolbar, type SortOption } from './AgentGalleryToolbar';
import {
  AgentGalleryFetchError,
  AgentGalleryNoAgents,
  AgentGallerySkeleton,
} from './AgentGalleryStates';
import { useAgentGalleryData } from './useAgentGalleryData';
import { usePinnedRecent } from './usePinnedRecent';
import { useTranslation } from '../../hooks/useTranslation';

const INITIAL_VISIBLE = 8;

interface AgentGalleryProps {
  onAgentSelect: (agentId: string, agentName: string) => void;
  onAgentInfo?: (agent: AgentWithCard) => void;
}

export const AgentGallery: FC<AgentGalleryProps> = ({
  onAgentSelect,
  onAgentInfo,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const api = useApi(augmentApiRef);
  const { agents, loading, error, fetchAgents } = useAgentGalleryData(api);
  const { pinnedIds, recentIds, togglePin, addRecent } = usePinnedRecent();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [sort, setSort] = useState<SortOption>('name');
  const [expanded, setExpanded] = useState(false);
  const [frameworkFilter, setFrameworkFilter] = useState('');

  const handleSelect = useCallback(
    (agent: AgentWithCard) => {
      const agentId = `${agent.namespace}/${agent.name}`;
      const displayName = agent.agentCard?.name || agent.name;
      addRecent(agentId);
      onAgentSelect(agentId, displayName);
    },
    [onAgentSelect, addRecent],
  );

  const frameworks = useMemo(() => {
    const set = new Set<string>();
    agents.forEach(a => {
      if (a.labels?.framework) set.add(a.labels.framework);
    });
    return Array.from(set).sort();
  }, [agents]);

  const filtered = useMemo(() => {
    let list = agents;
    if (tab === 'pinned') {
      list = list.filter(a => pinnedIds.includes(`${a.namespace}/${a.name}`));
    } else if (tab === 'recent') {
      const recentSet = new Set(recentIds);
      list = list.filter(a => recentSet.has(`${a.namespace}/${a.name}`));
      list.sort((a, b) => {
        const aIdx = recentIds.indexOf(`${a.namespace}/${a.name}`);
        const bIdx = recentIds.indexOf(`${b.namespace}/${b.name}`);
        return aIdx - bIdx;
      });
      return list;
    }
    if (frameworkFilter) {
      list = list.filter(a => a.labels?.framework === frameworkFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a => {
        const name = (a.agentCard?.name || a.name).toLowerCase();
        const desc = (
          a.agentCard?.description ||
          a.description ||
          ''
        ).toLowerCase();
        const skills = (a.agentCard?.skills || [])
          .map(s => (s.name || '').toLowerCase())
          .join(' ');
        return name.includes(q) || desc.includes(q) || skills.includes(q);
      });
    }
    return sortAgents(list, sort);
  }, [agents, tab, search, pinnedIds, recentIds, sort, frameworkFilter]);

  const visibleAgents = expanded
    ? filtered
    : filtered.slice(0, INITIAL_VISIBLE);
  const hasMore = filtered.length > INITIAL_VISIBLE;

  if (error) {
    return <AgentGalleryFetchError error={error} onRetry={fetchAgents} />;
  }
  if (loading) {
    return <AgentGallerySkeleton />;
  }
  if (agents.length === 0) {
    return <AgentGalleryNoAgents />;
  }

  return (
    <Box>
      <AgentGalleryToolbar
        search={search}
        onSearchChange={setSearch}
        tab={tab}
        onTabChange={setTab}
        frameworks={frameworks}
        recentCount={recentIds.length}
        pinnedCount={pinnedIds.length}
        totalCount={agents.length}
        filteredCount={filtered.length}
        sort={sort}
        onSortChange={setSort}
        frameworkFilter={frameworkFilter}
        onFrameworkFilterChange={setFrameworkFilter}
      />
      <Box role="list" aria-label={t('agentGallery.listAriaLabel')}>
        {filtered.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 3,
              color: theme.palette.text.secondary,
            }}
          >
            <Typography variant="body2">
              {search
                ? t('agentGallery.noMatchSearch')
                : t('agentGallery.noAgentsInCategory')}
            </Typography>
          </Box>
        ) : (
          <>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 2,
              }}
            >
              {visibleAgents.map((agent, idx) => {
                const agentId = `${agent.namespace}/${agent.name}`;
                return (
                  <AgentCard
                    key={agentId}
                    agent={agent}
                    isPinned={pinnedIds.includes(agentId)}
                    onSelect={handleSelect}
                    onTogglePin={togglePin}
                    onInfo={onAgentInfo}
                    index={idx}
                  />
                );
              })}
            </Box>
            {hasMore && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button
                  size="small"
                  onClick={() => setExpanded(prev => !prev)}
                  endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  sx={{ textTransform: 'none', fontSize: '0.8rem' }}
                >
                  {expanded
                    ? 'Show less'
                    : `Show all ${filtered.length} agents`}
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

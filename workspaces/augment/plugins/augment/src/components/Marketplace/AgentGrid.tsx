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

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import { useTheme } from '@mui/material/styles';
import type { ChatAgent } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { CompactAgentCard } from './CompactAgentCard';
import { gridContainerSx } from './marketplace.styles';
import { CARD_HEIGHT, PAGE_SIZE } from './marketplace.constants';

interface AgentGridProps {
  agents: ChatAgent[];
  loading: boolean;
  onAgentClick: (agentId: string) => void;
  emptyMessage?: string;
  emptyAction?: { label: string; onClick: () => void };
}

export function AgentGrid({ agents, loading, onAgentClick, emptyMessage, emptyAction }: AgentGridProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (loading) {
    return (
      <Box sx={gridContainerSx(isDark)}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={CARD_HEIGHT} sx={{ borderRadius: 2 }} />
        ))}
      </Box>
    );
  }

  if (agents.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 6,
          gap: 1.5,
        }}
      >
        <SmartToyOutlinedIcon sx={{ fontSize: 40, color: theme.palette.text.disabled }} />
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, textAlign: 'center', maxWidth: 320 }}>
          {emptyMessage || 'No agents found.'}
        </Typography>
        {emptyAction && (
          <Button
            variant="outlined"
            size="small"
            onClick={emptyAction.onClick}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, mt: 1 }}
          >
            {emptyAction.label}
          </Button>
        )}
      </Box>
    );
  }

  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(agents.length / PAGE_SIZE);
  const pageAgents = agents.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <>
      <Box sx={gridContainerSx(isDark)}>
        {pageAgents.map(agent => (
          <CompactAgentCard
            key={agent.id}
            agent={agent}
            onClick={() => onAgentClick(agent.id)}
          />
        ))}
      </Box>
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5, mt: 3 }}>
          <Button
            size="small"
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 36,
              borderRadius: 1.5,
              color: theme.palette.text.secondary,
              '&:hover': { color: theme.palette.primary.main },
            }}
          >
            Prev
          </Button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <Button
              key={i}
              size="small"
              variant={i === page ? 'contained' : 'text'}
              onClick={() => setPage(i)}
              sx={{
                minWidth: 32,
                height: 32,
                borderRadius: '50%',
                fontWeight: i === page ? 700 : 500,
                fontSize: '0.82rem',
                boxShadow: 'none',
                color: i === page ? undefined : theme.palette.text.secondary,
                '&:hover': { boxShadow: 'none' },
              }}
            >
              {i + 1}
            </Button>
          ))}
          <Button
            size="small"
            disabled={page === totalPages - 1}
            onClick={() => setPage(p => p + 1)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 36,
              borderRadius: 1.5,
              color: theme.palette.text.secondary,
              '&:hover': { color: theme.palette.primary.main },
            }}
          >
            Next
          </Button>
        </Box>
      )}
    </>
  );
}

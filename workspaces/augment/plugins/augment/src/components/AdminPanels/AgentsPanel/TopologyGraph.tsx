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
import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { useTheme, alpha } from '@mui/material/styles';
import {
  SECTION_LABEL_SX,
  HOVER_TRANSITION,
  subtleBorder,
} from '../shared/commandCenterStyles';
import type { AgentFormData, PublishAsRole } from './agentValidation';

export interface TopologyEdge {
  from: string;
  to: string;
  type: 'handoff' | 'subtask';
}

interface TopologyGraphProps {
  agents: Record<string, AgentFormData>;
  edges: TopologyEdge[];
  agentRoles: Record<string, PublishAsRole>;
  selectedAgentKey: string | null;
  onSelectAgent: (key: string) => void;
}

export const TopologyGraph = React.memo(function TopologyGraph({
  agents,
  edges,
  agentRoles,
  selectedAgentKey,
  onSelectAgent,
}: TopologyGraphProps) {
  const theme = useTheme();

  const nodes = useMemo(() => {
    const set = new Set<string>();
    edges.forEach(e => {
      set.add(e.from);
      set.add(e.to);
    });
    return Array.from(set);
  }, [edges]);

  if (edges.length === 0) return null;

  return (
    <Box sx={{ mt: 1 }}>
      <Typography sx={SECTION_LABEL_SX}>Agent Topology</Typography>
      <Box
        sx={{
          mt: 1,
          p: 2,
          borderRadius: 2,
          border: subtleBorder(theme),
          bgcolor: alpha(theme.palette.background.default, 0.5),
          position: 'relative',
          minHeight: 60,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            justifyContent: 'center',
          }}
        >
          {nodes.map(nodeKey => {
            const isCurrent = nodeKey === selectedAgentKey;
            const role = agentRoles[nodeKey] ?? 'standalone';
            return (
              <Box
                key={nodeKey}
                onClick={() => onSelectAgent(nodeKey)}
                sx={{
                  p: 1,
                  px: 1.5,
                  borderRadius: 1.5,
                  border: isCurrent
                    ? `2px solid ${theme.palette.primary.main}`
                    : `1px solid ${theme.palette.divider}`,
                  bgcolor: isCurrent
                    ? alpha(theme.palette.primary.main, 0.06)
                    : theme.palette.background.paper,
                  cursor: 'pointer',
                  transition: HOVER_TRANSITION,
                  '&:hover': { borderColor: theme.palette.primary.main },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  minWidth: 100,
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: isCurrent ? 700 : 500,
                  }}
                >
                  {agents[nodeKey]?.name || nodeKey}
                </Typography>
                <Chip
                  label={role}
                  size="small"
                  color={
                    role === 'router'
                      ? 'primary'
                      : role === 'specialist'
                        ? 'secondary'
                        : 'default'
                  }
                  sx={{
                    height: 16,
                    fontSize: '0.55rem',
                    '& .MuiChip-label': { px: 0.5 },
                  }}
                />
              </Box>
            );
          })}
        </Box>
        <Box
          sx={{
            mt: 1.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
          }}
        >
          {edges.map(edge => {
            const isCurrent =
              edge.from === selectedAgentKey || edge.to === selectedAgentKey;
            return (
              <Box
                key={`${edge.from}-${edge.to}-${edge.type}`}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  fontSize: '0.7rem',
                  fontFamily: 'monospace',
                  fontWeight: isCurrent ? 600 : 400,
                  color: isCurrent
                    ? theme.palette.text.primary
                    : theme.palette.text.secondary,
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    fontSize: 'inherit',
                    fontFamily: 'inherit',
                    fontWeight: 'inherit',
                  }}
                >
                  {agents[edge.from]?.name || edge.from}
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    fontSize: 'inherit',
                    color:
                      edge.type === 'handoff'
                        ? theme.palette.info.main
                        : theme.palette.secondary.main,
                  }}
                >
                  {edge.type === 'handoff'
                    ? '\u2192 transfers to'
                    : '\u21E2 delegates to'}
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    fontSize: 'inherit',
                    fontFamily: 'inherit',
                    fontWeight: 'inherit',
                  }}
                >
                  {agents[edge.to]?.name || edge.to}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
});

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
import Avatar from '@mui/material/Avatar';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PublicIcon from '@mui/icons-material/Public';
import CodeIcon from '@mui/icons-material/Code';
import ExtensionIcon from '@mui/icons-material/Extension';
import { useTheme, alpha } from '@mui/material/styles';
import { SECTION_LABEL_SX } from '../shared/commandCenterStyles';
import type { AgentFormData } from './agentValidation';

interface AgentPreviewCardProps {
  agent: AgentFormData;
}

export const AgentPreviewCard = React.memo(function AgentPreviewCard({
  agent,
}: AgentPreviewCardProps) {
  const theme = useTheme();

  const caps = useMemo(() => {
    const items: Array<{ icon: React.ReactElement; label: string }> = [];
    if (agent.enableRAG)
      items.push({ icon: <MenuBookIcon sx={{ fontSize: 14 }} />, label: 'RAG' });
    if (agent.enableWebSearch)
      items.push({ icon: <PublicIcon sx={{ fontSize: 14 }} />, label: 'Web' });
    if (agent.enableCodeInterpreter)
      items.push({ icon: <CodeIcon sx={{ fontSize: 14 }} />, label: 'Code' });
    if (agent.mcpServers.length > 0)
      items.push({
        icon: <ExtensionIcon sx={{ fontSize: 14 }} />,
        label: `${agent.mcpServers.length} MCP`,
      });
    return items;
  }, [
    agent.enableRAG,
    agent.enableWebSearch,
    agent.enableCodeInterpreter,
    agent.mcpServers,
  ]);

  return (
    <Box
      sx={{
        width: 240,
        flexShrink: 0,
        borderLeft: `1px solid ${theme.palette.divider}`,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <VisibilityOutlinedIcon
          sx={{ fontSize: 16, color: theme.palette.text.secondary }}
        />
        <Typography sx={{ ...SECTION_LABEL_SX, fontSize: '0.7rem' }}>
          Preview
        </Typography>
      </Box>
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
        }}
      >
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            color: theme.palette.primary.main,
            fontSize: '1rem',
            fontWeight: 700,
            mb: 1.5,
          }}
        >
          {agent.name ? agent.name.charAt(0).toUpperCase() : '?'}
        </Avatar>
        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 0.25 }}>
          {agent.name || 'Unnamed Agent'}
        </Typography>
        <Typography
          sx={{
            fontSize: '0.7rem',
            color: theme.palette.text.secondary,
            lineHeight: 1.4,
            mb: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {agent.instructions.trim()
            ? agent.instructions.substring(0, 100)
            : 'No instructions yet'}
        </Typography>
        {caps.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {caps.map(c => (
              <Chip
                key={c.label}
                icon={c.icon}
                label={c.label}
                size="small"
                variant="outlined"
                sx={{
                  height: 20,
                  fontSize: '0.6rem',
                  '& .MuiChip-icon': { fontSize: 12 },
                }}
              />
            ))}
          </Box>
        )}
      </Box>
      <Typography
        sx={{
          fontSize: '0.6rem',
          color: theme.palette.text.disabled,
          mt: 1,
          textAlign: 'center',
        }}
      >
        How users see this agent
      </Typography>
    </Box>
  );
});

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
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import ExtensionIcon from '@mui/icons-material/Extension';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PublicIcon from '@mui/icons-material/Public';
import CodeIcon from '@mui/icons-material/Code';
import StarIcon from '@mui/icons-material/Star';
import { useTheme, alpha } from '@mui/material/styles';
import type { AgentFormData, PublishAsRole } from './agentValidation';

interface AgentListItemProps {
  agentKey: string;
  agent: AgentFormData;
  isSelected: boolean;
  isDefault: boolean;
  isSingleAgent: boolean;
  outCount: number;
  inCount: number;
  effectiveRole: PublishAsRole;
  onSelect: (key: string) => void;
}

const ROLE_CHIP_CONFIG: Record<PublishAsRole, { label: string; color: 'primary' | 'default' | 'secondary' }> = {
  router: { label: 'Router', color: 'primary' },
  specialist: { label: 'Specialist', color: 'secondary' },
  standalone: { label: 'Standalone', color: 'default' },
};

export const AgentListItem = React.memo(function AgentListItem({
  agentKey,
  agent,
  isSelected,
  isDefault,
  isSingleAgent,
  outCount,
  inCount,
  effectiveRole,
  onSelect,
}: AgentListItemProps) {
  const theme = useTheme();
  const hasCapabilities =
    agent.mcpServers.length > 0 ||
    agent.enableRAG ||
    agent.enableWebSearch ||
    agent.enableCodeInterpreter;

  return (
    <Box
      onClick={() => onSelect(agentKey)}
      role="button"
      tabIndex={0}
      aria-label={`Select agent ${agent.name || agentKey}${isDefault ? ', starting agent' : ''}`}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(agentKey);
        }
      }}
      sx={{
        px: 1.5,
        py: 1,
        cursor: 'pointer',
        borderRadius: 1,
        mx: 0.75,
        mb: 0.25,
        backgroundColor: isSelected
          ? alpha(theme.palette.primary.main, 0.08)
          : 'transparent',
        borderLeft: isSelected
          ? `3px solid ${theme.palette.primary.main}`
          : '3px solid transparent',
        transition: 'background-color 0.1s',
        '&:hover': {
          backgroundColor: isSelected
            ? alpha(theme.palette.primary.main, 0.08)
            : alpha(theme.palette.action.hover, 0.4),
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {isDefault && !isSingleAgent && (
          <StarIcon sx={{ fontSize: 13, color: theme.palette.warning.main }} />
        )}
        <Typography
          noWrap
          sx={{
            fontWeight: isSelected ? 600 : 500,
            fontSize: '0.8125rem',
            flex: 1,
            lineHeight: 1.3,
          }}
        >
          {agent.name || agentKey}
        </Typography>
        <Chip
          label={ROLE_CHIP_CONFIG[effectiveRole].label}
          color={ROLE_CHIP_CONFIG[effectiveRole].color}
          size="small"
          variant="outlined"
          sx={{
            height: 16,
            fontSize: '0.55rem',
            fontWeight: 600,
            '& .MuiChip-label': { px: 0.75 },
          }}
        />
      </Box>
      {(hasCapabilities || outCount > 0 || inCount > 0) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            mt: 0.25,
            ml: isDefault && !isSingleAgent ? 2.25 : 0,
          }}
        >
          {agent.mcpServers.length > 0 && (
            <Tooltip title={`${agent.mcpServers.length} MCP`} placement="top">
              <ExtensionIcon
                sx={{ fontSize: 12, color: theme.palette.text.disabled }}
              />
            </Tooltip>
          )}
          {agent.enableRAG && (
            <Tooltip title="Knowledge Base" placement="top">
              <MenuBookIcon
                sx={{ fontSize: 12, color: theme.palette.text.disabled }}
              />
            </Tooltip>
          )}
          {agent.enableWebSearch && (
            <Tooltip title="Web Search" placement="top">
              <PublicIcon
                sx={{ fontSize: 12, color: theme.palette.text.disabled }}
              />
            </Tooltip>
          )}
          {agent.enableCodeInterpreter && (
            <Tooltip title="Code Interpreter" placement="top">
              <CodeIcon
                sx={{ fontSize: 12, color: theme.palette.text.disabled }}
              />
            </Tooltip>
          )}
          {(outCount > 0 || inCount > 0) && (
            <Typography
              sx={{
                fontSize: '0.6rem',
                color: theme.palette.text.disabled,
                ml: 'auto',
              }}
            >
              {outCount > 0 && `${outCount} out`}
              {outCount > 0 && inCount > 0 && ' \u00b7 '}
              {inCount > 0 && `${inCount} in`}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
});

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
import { memo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useTheme, alpha } from '@mui/material/styles';

interface AgentEditorHeaderProps {
  isSingleAgentMode: boolean;
  autoCreate?: boolean;
  agentName?: string;
  agentCount: number;
  isDirty: boolean;
  showPreview: boolean;
  onTogglePreview: () => void;
}

export const AgentEditorHeader = memo(function AgentEditorHeader({
  isSingleAgentMode,
  autoCreate,
  agentName,
  agentCount,
  isDirty,
  showPreview,
  onTogglePreview,
}: AgentEditorHeaderProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        borderBottom: `1px solid ${theme.palette.divider}`,
        flexShrink: 0,
        bgcolor: alpha(theme.palette.primary.main, 0.02),
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1,
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {(() => {
          if (isSingleAgentMode)
            return (
              <SmartToyOutlinedIcon
                sx={{ fontSize: 18, color: theme.palette.primary.main }}
              />
            );
          if (autoCreate)
            return (
              <GroupsOutlinedIcon
                sx={{ fontSize: 18, color: theme.palette.primary.main }}
              />
            );
          return (
            <EditOutlinedIcon
              sx={{ fontSize: 18, color: theme.palette.primary.main }}
            />
          );
        })()}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography
          sx={{ fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.3 }}
        >
          {(() => {
            if (isSingleAgentMode) return 'Create Agent';
            if (autoCreate) return 'Agent Team Editor';
            if (agentName) return `Editing ${agentName}`;
            return 'Agent Configuration';
          })()}
        </Typography>
        <Typography
          sx={{ fontSize: '0.7rem', color: theme.palette.text.secondary }}
        >
          {(() => {
            if (isSingleAgentMode)
              return "Define your agent's capabilities and instructions";
            if (autoCreate)
              return `${agentCount} agent${agentCount !== 1 ? 's' : ''} in team`;
            return 'Configure agent behavior and tools';
          })()}
        </Typography>
      </Box>
      {!isSingleAgentMode && (
        <Tooltip title="Toggle agent preview">
          <IconButton size="small" onClick={onTogglePreview}>
            <VisibilityOutlinedIcon
              fontSize="small"
              sx={{
                color: showPreview ? theme.palette.primary.main : undefined,
              }}
            />
          </IconButton>
        </Tooltip>
      )}
      {isDirty && (
        <Chip
          label="Unsaved"
          size="small"
          color="warning"
          variant="outlined"
          sx={{ fontSize: '0.65rem', height: 22 }}
        />
      )}
    </Box>
  );
});

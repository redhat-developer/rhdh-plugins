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

export const AgentEditorHeader = React.memo(function AgentEditorHeader({
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
        {isSingleAgentMode ? (
          <SmartToyOutlinedIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
        ) : autoCreate ? (
          <GroupsOutlinedIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
        ) : (
          <EditOutlinedIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
        )}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.3 }}>
          {isSingleAgentMode
            ? 'Create Agent'
            : autoCreate
              ? 'Agent Team Editor'
              : agentName
                ? `Editing ${agentName}`
                : 'Agent Configuration'}
        </Typography>
        <Typography sx={{ fontSize: '0.7rem', color: theme.palette.text.secondary }}>
          {isSingleAgentMode
            ? "Define your agent's capabilities and instructions"
            : autoCreate
              ? `${agentCount} agent${agentCount !== 1 ? 's' : ''} in team`
              : 'Configure agent behavior and tools'}
        </Typography>
      </Box>
      {!isSingleAgentMode && (
        <Tooltip title="Toggle agent preview">
          <IconButton size="small" onClick={onTogglePreview}>
            <VisibilityOutlinedIcon fontSize="small" sx={{ color: showPreview ? theme.palette.primary.main : undefined }} />
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

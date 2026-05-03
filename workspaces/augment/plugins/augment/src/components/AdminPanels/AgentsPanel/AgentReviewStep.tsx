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
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import SaveIcon from '@mui/icons-material/Save';
import { useTheme, alpha } from '@mui/material/styles';
import {
  SECTION_LABEL_SX,
  sectionCardSx,
} from '../shared/commandCenterStyles';
import type { AgentFormData } from './agentValidation';

interface AgentReviewStepProps {
  agent: AgentFormData;
  agentKey: string;
  validationErrors: string[];
  saving: boolean;
  saveSuccess: boolean;
  availableMcpServers?: { id: string; name: string }[];
  onSave: () => void;
  onDone?: () => void;
  onBack?: () => void;
}

export const AgentReviewStep = React.memo(function AgentReviewStep({
  agent,
  agentKey,
  validationErrors,
  saving,
  saveSuccess,
  availableMcpServers = [],
  onSave,
  onDone,
  onBack,
}: AgentReviewStepProps) {
  const theme = useTheme();

  const caps = useMemo(() => {
    const items: string[] = [];
    if (agent.enableRAG) items.push('Knowledge Base');
    if (agent.enableWebSearch) items.push('Web Search');
    if (agent.enableCodeInterpreter) items.push('Code Interpreter');
    return items;
  }, [agent.enableRAG, agent.enableWebSearch, agent.enableCodeInterpreter]);

  const mcpServerNames = useMemo(() => {
    return agent.mcpServers.map(
      id => availableMcpServers.find(s => s.id === id)?.name || id,
    );
  }, [agent.mcpServers, availableMcpServers]);

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
        Review & Save
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review your agent configuration before saving. You can always edit it
        later.
      </Typography>

      {validationErrors.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {validationErrors.map(err => (
            <Typography
              key={err}
              variant="body2"
              sx={{ fontSize: '0.8rem' }}
            >
              &bull; {err}
            </Typography>
          ))}
        </Alert>
      )}

      <Box sx={{ ...sectionCardSx(theme), mb: 2, p: 2.5, borderRadius: 2 }}>
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}
        >
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: theme.palette.primary.main,
              fontSize: '1.2rem',
              fontWeight: 700,
            }}
          >
            {agent.name ? agent.name.charAt(0).toUpperCase() : '?'}
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>
              {agent.name || 'Unnamed Agent'}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: theme.palette.text.secondary,
                fontFamily: 'monospace',
              }}
            >
              {agentKey}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Typography sx={{ ...SECTION_LABEL_SX, minWidth: 100, pt: 0.25 }}>
              Model
            </Typography>
            <Typography variant="body2">
              {agent.model || 'Global default'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Typography sx={{ ...SECTION_LABEL_SX, minWidth: 100, pt: 0.25 }}>
              Tools
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {caps.length > 0 ? (
                caps.map(c => (
                  <Chip
                    key={c}
                    label={c}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  None configured
                </Typography>
              )}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Typography sx={{ ...SECTION_LABEL_SX, minWidth: 100, pt: 0.25 }}>
              MCP Servers
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {mcpServerNames.length > 0 ? (
                mcpServerNames.map(name => (
                  <Chip
                    key={name}
                    label={name}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  None selected
                </Typography>
              )}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Typography sx={{ ...SECTION_LABEL_SX, minWidth: 100, pt: 0.25 }}>
              Instructions
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: agent.instructions.trim()
                  ? undefined
                  : theme.palette.error.main,
              }}
            >
              {agent.instructions.trim()
                ? `${agent.instructions.trim().substring(0, 120)}${agent.instructions.length > 120 ? '...' : ''}`
                : 'Not set \u2014 required'}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        {onBack && (
          <Button
            size="large"
            onClick={onBack}
            sx={{ textTransform: 'none' }}
          >
            Back
          </Button>
        )}
        <Button
          variant="contained"
          size="large"
          startIcon={
            saving ? <CircularProgress size={18} /> : <SaveIcon />
          }
          onClick={onSave}
          disabled={saving || validationErrors.length > 0}
          sx={{ textTransform: 'none', fontWeight: 600, px: 4 }}
        >
          {saveSuccess ? 'Saved!' : 'Save Agent'}
        </Button>
        {saveSuccess && onDone && (
          <Button
            variant="outlined"
            size="large"
            onClick={onDone}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Done
          </Button>
        )}
      </Box>
    </Box>
  );
});

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
import React, { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Popover from '@mui/material/Popover';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useTheme } from '@mui/material/styles';

interface FieldHelpEntry {
  title: string;
  description: string;
  recommended?: string;
}

const FIELD_HELP: Record<string, FieldHelpEntry> = {
  toolChoice: {
    title: 'Tool Choice',
    description:
      'Controls when the model invokes tools. "auto" lets the model decide, "required" forces tool use on every turn, "none" disables tools entirely.',
    recommended:
      'Use "auto" for most agents. Use "required" for pure routing agents that should always delegate.',
  },
  reasoning: {
    title: 'Reasoning Effort',
    description:
      'Controls how much computation the model spends on chain-of-thought reasoning before responding.',
    recommended:
      '"medium" works well for most tasks. Use "high" for complex multi-step problems.',
  },
  temperature: {
    title: 'Temperature',
    description:
      "Controls randomness in the model's output. Lower values (0.0-0.3) produce more focused, deterministic responses. Higher values (0.7-1.5) produce more creative, varied responses.",
    recommended:
      '0.0-0.2 for factual/code tasks, 0.5-0.8 for creative writing.',
  },
  maxOutputTokens: {
    title: 'Max Output Tokens',
    description:
      'The maximum number of tokens the model can generate in a single response. One token is roughly 4 characters.',
    recommended:
      "Leave empty to use the model's default. Set to 4096 for long-form content.",
  },
  maxToolCalls: {
    title: 'Max Tool Calls',
    description:
      'Limits the number of tool invocations the model can make in a single turn to prevent runaway loops.',
    recommended:
      'Leave empty for default. Set to 5-10 for agents with many tools.',
  },
  guardrails: {
    title: 'Guardrails',
    description:
      "Comma-separated list of LlamaGuard shield IDs to apply to this agent's inputs and outputs for content safety filtering.",
    recommended:
      'Add shields for user-facing agents that handle sensitive topics.',
  },
};

interface FieldHelpButtonProps {
  field: string;
}

export const FieldHelpButton = React.memo(function FieldHelpButton({
  field,
}: FieldHelpButtonProps) {
  const theme = useTheme();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const info = FIELD_HELP[field];

  const handleOpen = useCallback(
    (e: React.MouseEvent<HTMLElement>) => setAnchor(e.currentTarget),
    [],
  );
  const handleClose = useCallback(() => setAnchor(null), []);

  if (!info) return null;

  return (
    <>
      <Tooltip title={`Learn about ${info.title}`}>
        <IconButton
          size="small"
          onClick={handleOpen}
          sx={{ ml: 0.25, p: 0.25 }}
        >
          <InfoOutlinedIcon
            sx={{ fontSize: 15, color: theme.palette.text.disabled }}
          />
        </IconButton>
      </Tooltip>
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        sx={{ '& .MuiPopover-paper': { maxWidth: 320, p: 2 } }}
      >
        <Box>
          <Typography
            sx={{ fontWeight: 600, fontSize: '0.85rem', mb: 0.75 }}
          >
            {info.title}
          </Typography>
          <Typography
            sx={{
              fontSize: '0.8rem',
              color: theme.palette.text.secondary,
              mb: 1,
            }}
          >
            {info.description}
          </Typography>
          {info.recommended && (
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: theme.palette.info.main,
                fontStyle: 'italic',
              }}
            >
              {info.recommended}
            </Typography>
          )}
        </Box>
      </Popover>
    </>
  );
});

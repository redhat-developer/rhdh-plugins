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
import Typography from '@mui/material/Typography';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Collapse from '@mui/material/Collapse';
import { alpha, type Theme } from '@mui/material/styles';
import type { BrandingConfig } from '../../types';

export interface ReasoningDisplayProps {
  reasoning: string;
  reasoningDuration?: number;
  isStreaming: boolean;
  theme: Theme;
  branding: BrandingConfig;
}

/**
 * Renders the model's reasoning/thinking content (collapsible)
 */
export function ReasoningDisplay({
  reasoning,
  reasoningDuration,
  isStreaming,
  theme,
  branding,
}: ReasoningDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const chipLabel = isStreaming ? 'Thinking\u2026' : 'Thought';

  const durationBadge =
    reasoningDuration !== undefined ? `${reasoningDuration}s` : undefined;

  return (
    <Box sx={{ mb: 1.5 }}>
      {/* Compact chip header */}
      <Box
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} reasoning`}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(prev => !prev);
          }
        }}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1,
          py: 0.25,
          borderRadius: 2,
          cursor: 'pointer',
          backgroundColor: alpha(theme.palette.text.primary, 0.04),
          transition: 'background-color 0.15s',
          '&:hover': {
            backgroundColor: alpha(theme.palette.text.primary, 0.08),
          },
        }}
      >
        <PsychologyIcon
          sx={{
            fontSize: 14,
            color: branding.secondaryColor,
            animation: isStreaming ? 'pulse 1.5s ease-in-out infinite' : 'none',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.5 },
            },
          }}
        />
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontWeight: 500,
            fontSize: '0.7rem',
          }}
        >
          {chipLabel}
        </Typography>
        {durationBadge && (
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.6rem',
              fontWeight: 600,
              color: branding.secondaryColor,
              backgroundColor: alpha(
                branding.secondaryColor || theme.palette.primary.main,
                0.1,
              ),
              px: 0.5,
              py: 0,
              borderRadius: 1,
              lineHeight: 1.6,
            }}
          >
            {durationBadge}
          </Typography>
        )}
        {isExpanded ? (
          <ExpandLessIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
        ) : (
          <ExpandMoreIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
        )}
      </Box>

      {/* Collapsible reasoning text */}
      <Collapse in={isExpanded}>
        <Box
          sx={{
            mt: 0.5,
            ml: 0.5,
            pl: 1.5,
            borderLeft: `2px solid ${alpha(branding.secondaryColor || theme.palette.primary.main, 0.3)}`,
            maxHeight: 200,
            overflow: 'auto',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontStyle: 'italic',
              whiteSpace: 'pre-wrap',
              fontSize: '0.8rem',
              lineHeight: 1.5,
            }}
          >
            {reasoning}
            {isStreaming && (
              <Box
                component="span"
                sx={{
                  display: 'inline-block',
                  width: 6,
                  height: 14,
                  ml: 0.5,
                  backgroundColor: branding.secondaryColor,
                  animation: 'blink 1s step-end infinite',
                  '@keyframes blink': {
                    '50%': { opacity: 0 },
                  },
                }}
              />
            )}
          </Typography>
        </Box>
      </Collapse>
    </Box>
  );
}

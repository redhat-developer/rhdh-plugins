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
import { getPreviewSnippet } from '../../utils';

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

  const durationBadge =
    reasoningDuration !== undefined ? `${reasoningDuration}s` : undefined;

  let chipLabel = 'Thought';
  if (isStreaming) {
    chipLabel = 'Thinking\u2026';
  } else if (durationBadge) {
    chipLabel = `Thought for ${durationBadge}`;
  }

  const preview = !isExpanded ? getPreviewSnippet(reasoning) : '';

  return (
    <Box sx={{ mb: 1.5 }}>
      {/* Compact chip header with preview */}
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
          maxWidth: '100%',
          '&:hover': {
            backgroundColor: alpha(theme.palette.text.primary, 0.08),
          },
        }}
      >
        <PsychologyIcon
          sx={{
            fontSize: 14,
            color: branding.secondaryColor,
            flexShrink: 0,
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
            flexShrink: 0,
          }}
        >
          {chipLabel}
        </Typography>
        {!isExpanded && preview && (
          <Typography
            variant="caption"
            sx={{
              color: 'text.disabled',
              fontStyle: 'italic',
              fontSize: '0.65rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
          >
            — {preview}
          </Typography>
        )}
        {isStreaming && !isExpanded && (
          <Box
            component="span"
            sx={{
              display: 'inline-block',
              width: 5,
              height: 12,
              ml: 0.25,
              flexShrink: 0,
              backgroundColor: branding.secondaryColor,
              animation: 'augmentBlink 1s step-end infinite',
              '@keyframes augmentBlink': {
                '50%': { opacity: 0 },
              },
            }}
          />
        )}
        {isExpanded ? (
          <ExpandLessIcon
            sx={{ fontSize: 14, color: 'text.disabled', flexShrink: 0 }}
          />
        ) : (
          <ExpandMoreIcon
            sx={{ fontSize: 14, color: 'text.disabled', flexShrink: 0 }}
          />
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
                  animation: 'augmentBlink 1s step-end infinite',
                  '@keyframes augmentBlink': {
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

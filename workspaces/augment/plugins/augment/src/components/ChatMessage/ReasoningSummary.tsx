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
import Collapse from '@mui/material/Collapse';
import { alpha, useTheme } from '@mui/material/styles';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { getPreviewSnippet } from '../../utils';

interface ReasoningSummaryProps {
  reasoning: string;
  reasoningDuration?: number;
}

export function ReasoningSummary({
  reasoning,
  reasoningDuration,
}: ReasoningSummaryProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  if (!reasoning) return null;

  const label =
    reasoningDuration !== undefined
      ? `Thought for ${reasoningDuration}s`
      : 'Thought process';

  const preview = !expanded ? getPreviewSnippet(reasoning) : '';

  return (
    <Box sx={{ mb: 1 }}>
      <Box
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Collapse' : 'Expand'} reasoning`}
        onClick={() => setExpanded(prev => !prev)}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded(prev => !prev);
          }
        }}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: 0.75,
          py: 0.25,
          borderRadius: 1.5,
          cursor: 'pointer',
          bgcolor: alpha(theme.palette.text.primary, 0.04),
          transition: 'background-color 0.15s',
          maxWidth: '100%',
          '&:hover': {
            bgcolor: alpha(theme.palette.text.primary, 0.08),
          },
        }}
      >
        <PsychologyIcon
          sx={{
            fontSize: 14,
            color: theme.palette.text.disabled,
            flexShrink: 0,
          }}
        />
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.secondary,
            fontWeight: 500,
            fontSize: '0.7rem',
            flexShrink: 0,
          }}
        >
          {label}
        </Typography>
        {!expanded && preview && (
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.disabled,
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
        {expanded ? (
          <ExpandLessIcon
            sx={{ fontSize: 14, color: 'text.disabled', flexShrink: 0 }}
          />
        ) : (
          <ExpandMoreIcon
            sx={{ fontSize: 14, color: 'text.disabled', flexShrink: 0 }}
          />
        )}
      </Box>

      <Collapse in={expanded}>
        <Box
          sx={{
            mt: 0.5,
            ml: 0.5,
            pl: 1.5,
            borderLeft: `2px solid ${alpha(theme.palette.text.disabled, 0.3)}`,
            maxHeight: 200,
            overflow: 'auto',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontStyle: 'italic',
              whiteSpace: 'pre-wrap',
              fontSize: '0.8rem',
              lineHeight: 1.5,
            }}
          >
            {reasoning}
          </Typography>
        </Box>
      </Collapse>
    </Box>
  );
}

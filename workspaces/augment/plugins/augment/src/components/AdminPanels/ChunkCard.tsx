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
import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import type { RagTestResult } from '../../types';
import type { Theme } from '@mui/material/styles';
import { ScoreBar } from './ScoreBar';
import { highlightQueryTerms } from './ragResultsUtils';

const CHUNK_PREVIEW_LENGTH = 300;

export interface ChunkCardProps {
  chunk: RagTestResult['chunks'][number];
  index: number;
  query: string;
  expanded: boolean;
  onToggle: () => void;
  storeName?: string;
  showStore: boolean;
  theme: Theme;
  belowThreshold?: boolean;
}

export const ChunkCard = ({
  chunk,
  index,
  query,
  expanded,
  onToggle,
  storeName,
  showStore,
  theme,
  belowThreshold,
}: ChunkCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await window.navigator.clipboard.writeText(chunk.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API may not be available in all contexts
    }
  }, [chunk.text]);

  const isLong = chunk.text.length > CHUNK_PREVIEW_LENGTH;
  const displayText =
    expanded || !isLong
      ? chunk.text
      : `${chunk.text.slice(0, CHUNK_PREVIEW_LENGTH)}\u2026`;

  const estimatedTokens = Math.ceil(chunk.text.length / 4);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        mb: 1,
        borderColor: belowThreshold ? 'error.light' : 'divider',
        borderStyle: belowThreshold ? 'dashed' : 'solid',
        '&:hover': { borderColor: 'primary.light' },
        transition: 'border-color 0.15s ease',
      }}
    >
      {/* Card header: file info + actions + score */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 0.75,
          gap: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 0.75,
            alignItems: 'center',
            minWidth: 0,
            flexShrink: 1,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: 'text.secondary',
              bgcolor: 'action.hover',
              px: 0.75,
              py: 0.25,
              borderRadius: 0.5,
              fontSize: '0.7rem',
            }}
          >
            #{index + 1}
          </Typography>
          {chunk.fileName && (
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, fontSize: '0.8125rem' }}
              noWrap
            >
              {chunk.fileName}
            </Typography>
          )}
          {showStore && storeName && (
            <Chip
              label={storeName}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.675rem', height: 20 }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title={copied ? 'Copied!' : 'Copy chunk text'}>
            <IconButton size="small" onClick={handleCopy} sx={{ p: 0.25 }}>
              {copied ? (
                <CheckIcon sx={{ fontSize: 14, color: 'success.main' }} />
              ) : (
                <ContentCopyIcon
                  sx={{ fontSize: 14, color: 'text.disabled' }}
                />
              )}
            </IconButton>
          </Tooltip>
          {chunk.score !== undefined && (
            <ScoreBar score={chunk.score} theme={theme} />
          )}
        </Box>
      </Box>

      {/* Chunk metadata */}
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          mb: 0.75,
          px: 0.25,
          alignItems: 'center',
        }}
      >
        <Typography
          variant="caption"
          color="textSecondary"
          sx={{ fontSize: '0.65rem' }}
        >
          {chunk.text.length.toLocaleString()} chars / ~
          {estimatedTokens.toLocaleString()} tokens
        </Typography>
        {chunk.fileId && (
          <Tooltip title={chunk.fileId}>
            <Chip
              label={`ID: ${chunk.fileId.length > 12 ? `${chunk.fileId.slice(0, 12)}\u2026` : chunk.fileId}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.6rem', height: 16 }}
            />
          </Tooltip>
        )}
      </Box>

      {/* Chunk text with highlighting */}
      <Typography
        variant="body2"
        component="div"
        sx={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily: '"Roboto Mono", "Menlo", monospace',
          fontSize: '0.8rem',
          lineHeight: 1.6,
          color: 'text.primary',
          bgcolor: 'action.hover',
          borderRadius: 1,
          p: 1.25,
        }}
      >
        {highlightQueryTerms(displayText, query, theme.palette.warning.light)}
      </Typography>

      {/* Expand/collapse toggle */}
      {isLong && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: 0.5,
          }}
        >
          <Button
            size="small"
            onClick={onToggle}
            endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{
              textTransform: 'none',
              fontSize: '0.75rem',
              color: 'text.secondary',
            }}
          >
            {expanded
              ? 'Show less'
              : `Show full chunk (${chunk.text.length} chars)`}
          </Button>
        </Box>
      )}
    </Paper>
  );
};

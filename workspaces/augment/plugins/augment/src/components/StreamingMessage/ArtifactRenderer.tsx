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

import { useState, useCallback, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import LinearProgress from '@mui/material/LinearProgress';
import { useTheme, alpha } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckIcon from '@mui/icons-material/Check';
import { useTranslation } from '../../hooks/useTranslation';

const ARTIFACT_CARD_CONTAINER_SX_STATIC = {
  borderRadius: 2,
  overflow: 'hidden',
  transition: 'border-color 0.15s ease',
} as const;

const ARTIFACT_CARD_CONTENT_SX_STATIC = {
  px: 1.5,
  py: 1,
  maxHeight: 300,
  overflow: 'auto',
} as const;

interface Artifact {
  artifactId: string;
  name?: string;
  description?: string;
  content: string;
  lastChunk?: boolean;
}

interface ArtifactRendererProps {
  artifacts: Artifact[];
}

function detectContentType(content: string): 'json' | 'code' | 'text' {
  const trimmed = content.trim();
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      /* not json */
    }
  }
  if (/^(import |export |function |const |let |var |class |def |package |#include)/.test(trimmed)) {
    return 'code';
  }
  return 'text';
}

function formatContent(content: string, type: 'json' | 'code' | 'text'): string {
  if (type === 'json') {
    try {
      return JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      return content;
    }
  }
  return content;
}

function ArtifactCard({ artifact }: { artifact: Artifact }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const isStreaming = !artifact.lastChunk;
  const contentType = detectContentType(artifact.content);
  const formattedContent = formatContent(artifact.content, contentType);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(artifact.content);
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, [artifact.content]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([artifact.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = artifact.name || `artifact-${artifact.artifactId}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [artifact]);

  const artifactDisplayName = artifact.name || t('artifact.defaultName');

  return (
    <Box
      sx={{
        ...ARTIFACT_CARD_CONTAINER_SX_STATIC,
        border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
        bgcolor: alpha(theme.palette.info.main, isDark ? 0.04 : 0.02),
        '&:hover': {
          borderColor: alpha(theme.palette.info.main, 0.4),
        },
      }}
    >
      {/* Header */}
      <Box
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={t('artifact.headerAriaLabel', {
          name: artifactDisplayName,
          action: expanded ? t('artifact.collapse') : t('artifact.expand'),
        })}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 1,
          cursor: 'pointer',
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: -2,
          },
        }}
        onClick={() => setExpanded(prev => !prev)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded(prev => !prev);
          }
        }}
      >
        <DescriptionIcon sx={{ fontSize: 16, color: theme.palette.info.main }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            noWrap
            sx={{ fontWeight: 600, fontSize: '0.8rem' }}
          >
            {artifactDisplayName}
          </Typography>
          {artifact.description && (
            <Typography
              variant="caption"
              noWrap
              sx={{ color: 'text.secondary', display: 'block' }}
            >
              {artifact.description}
            </Typography>
          )}
        </Box>
        {isStreaming && (
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.info.main,
              fontSize: '0.65rem',
              fontWeight: 500,
            }}
          >
            {t('artifact.streaming')}
          </Typography>
        )}
        <Tooltip
          title={copied ? t('artifact.copied') : t('artifact.copyContent')}
        >
          <IconButton
            size="small"
            aria-label={t('artifact.copyContent')}
            onClick={e => { e.stopPropagation(); handleCopy(); }}
            sx={{ p: 0.5 }}
          >
            {copied ? (
              <CheckIcon sx={{ fontSize: 14, color: theme.palette.success.main }} />
            ) : (
              <ContentCopyIcon sx={{ fontSize: 14 }} />
            )}
          </IconButton>
        </Tooltip>
        <Tooltip title={t('artifact.download')}>
          <IconButton
            size="small"
            aria-label={t('artifact.downloadAriaLabel')}
            onClick={e => { e.stopPropagation(); handleDownload(); }}
            sx={{ p: 0.5 }}
          >
            <DownloadIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
        <ExpandMoreIcon
          sx={{
            fontSize: 18,
            transform: expanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
            color: theme.palette.text.secondary,
          }}
        />
      </Box>

      {isStreaming && <LinearProgress variant="indeterminate" sx={{ height: 2 }} />}

      {/* Content */}
      <Collapse in={expanded}>
        <Box
          sx={{
            ...ARTIFACT_CARD_CONTENT_SX_STATIC,
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          }}
        >
          <Typography
            component="pre"
            variant="body2"
            sx={{
              fontFamily: contentType !== 'text' ? 'monospace' : 'inherit',
              fontSize: '0.75rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              m: 0,
              lineHeight: 1.5,
            }}
          >
            {formattedContent}
          </Typography>
        </Box>
      </Collapse>
    </Box>
  );
}

export const ArtifactRenderer: React.FC<ArtifactRendererProps> = ({ artifacts }) => {
  if (artifacts.length === 0) return null;

  return (
    <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
      {artifacts.map(artifact => (
        <ArtifactCard key={artifact.artifactId} artifact={artifact} />
      ))}
    </Box>
  );
};

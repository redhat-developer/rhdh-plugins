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

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTheme, alpha } from '@mui/material/styles';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import type { StreamCitationReference } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { useTranslation } from '../../hooks/useTranslation';

interface CitationRendererProps {
  citations: StreamCitationReference[];
}

export const CitationRenderer: React.FC<CitationRendererProps> = ({ citations }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (citations.length === 0) return null;

  return (
    <Box sx={{ mt: 1.5 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          color: theme.palette.text.secondary,
          fontSize: '0.7rem',
          display: 'block',
          mb: 0.75,
        }}
      >
        {t('citation.sourcesWithCount', { count: citations.length })}
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
        {citations.map((citation, idx) => {
          const label =
            citation.title || t('citation.unnamedSource', { n: idx + 1 });
          const tooltipContent = citation.snippet ? (
            <Box sx={{ maxWidth: 300 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', mb: 0.5 }}>
                {label}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.4 }}>
                {citation.snippet.length > 200
                  ? `${citation.snippet.substring(0, 200)}...`
                  : citation.snippet}
              </Typography>
              {citation.url && (
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 0.5,
                    color: 'primary.main',
                    fontFamily: 'monospace',
                    fontSize: '0.65rem',
                  }}
                >
                  {citation.url}
                </Typography>
              )}
            </Box>
          ) : (
            label
          );

          return (
            <Tooltip key={`citation-${idx}`} title={tooltipContent} arrow>
              <Chip
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box
                      component="span"
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        bgcolor: alpha(theme.palette.primary.main, isDark ? 0.2 : 0.1),
                        color: theme.palette.primary.main,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </Box>
                    <span>{label}</span>
                    {citation.url && <OpenInNewIcon sx={{ fontSize: 10, ml: 0.25 }} />}
                  </Box>
                }
                size="small"
                variant="outlined"
                clickable={!!citation.url}
                onClick={
                  citation.url
                    ? () => window.open(citation.url, '_blank', 'noopener,noreferrer')
                    : undefined
                }
                sx={{
                  height: 24,
                  fontSize: '0.7rem',
                  borderRadius: 1.5,
                  '& .MuiChip-label': { px: 0.75 },
                  borderColor: alpha(theme.palette.primary.main, 0.25),
                  '&:hover': citation.url
                    ? {
                        borderColor: theme.palette.primary.main,
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                      }
                    : undefined,
                }}
              />
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
};

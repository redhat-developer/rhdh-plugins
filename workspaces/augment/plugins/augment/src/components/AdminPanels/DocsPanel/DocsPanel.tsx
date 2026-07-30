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

import { useState, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import { useTheme, alpha } from '@mui/material/styles';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useBranding } from '../../../hooks/useBranding';
import { DOCS, DOC_CATEGORIES, type DocSection } from './docsContent';

const TOC_WIDTH = 240;

function replaceAppName(content: string, appName: string): string {
  return content.replace(/\{\{appName\}\}/g, appName);
}

export function DocsPanel() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { branding } = useBranding();
  const appName = branding?.appName || 'Augment';

  const [activeDocId, setActiveDocId] = useState(DOCS[0]?.id ?? '');
  const [search, setSearch] = useState('');

  const filteredDocs = useMemo(() => {
    if (!search.trim()) return DOCS;
    const q = search.toLowerCase();
    return DOCS.filter(
      doc =>
        doc.title.toLowerCase().includes(q) ||
        doc.category.toLowerCase().includes(q) ||
        doc.content.toLowerCase().includes(q),
    );
  }, [search]);

  const groupedDocs = useMemo(() => {
    const groups: Record<string, DocSection[]> = {};
    for (const cat of DOC_CATEGORIES) {
      const items = filteredDocs.filter(d => d.category === cat);
      if (items.length > 0) groups[cat] = items;
    }
    return groups;
  }, [filteredDocs]);

  const activeDoc = DOCS.find(d => d.id === activeDocId);
  const activeCategory = activeDoc?.category ?? '';
  const renderedContent = activeDoc
    ? replaceAppName(activeDoc.content, appName)
    : '';

  const handleDocClick = useCallback((id: string) => {
    setActiveDocId(id);
  }, []);

  const docCount = DOCS.length;

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        maxWidth: 1200,
        mx: 'auto',
      }}
    >
      {/* Table of Contents */}
      <Box
        sx={{
          width: TOC_WIDTH,
          minWidth: TOC_WIDTH,
          flexShrink: 0,
          borderRight: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ px: 1.5, pt: 0.5, pb: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 1,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                fontSize: '0.8125rem',
                color: 'text.primary',
                letterSpacing: '-0.01em',
              }}
            >
              Documentation
            </Typography>
            <Chip
              label={docCount}
              size="small"
              sx={{
                height: 18,
                fontSize: '0.625rem',
                fontWeight: 700,
                bgcolor: alpha(theme.palette.primary.main, isDark ? 0.15 : 0.1),
                color: theme.palette.primary.main,
              }}
            />
          </Box>
          <TextField
            size="small"
            fullWidth
            placeholder="Filter..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '0.75rem',
                height: 32,
                borderRadius: 1,
                bgcolor: alpha(theme.palette.action.hover, isDark ? 0.3 : 0.4),
                '& fieldset': { border: 'none' },
                '&:hover fieldset': {
                  border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                },
                '&.Mui-focused fieldset': {
                  border: `1px solid ${theme.palette.primary.main}`,
                },
              },
            }}
          />
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto', px: 0.5, pb: 2 }}>
          {Object.entries(groupedDocs).map(([category, docs]) => (
            <Box key={category} sx={{ mb: 0.5 }}>
              <Typography
                variant="overline"
                sx={{
                  display: 'block',
                  px: 1,
                  pt: 1.25,
                  pb: 0.25,
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  color: alpha(theme.palette.text.secondary, 0.7),
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {category}
              </Typography>
              {docs.map(doc => {
                const isActive = doc.id === activeDocId;
                return (
                  <Box
                    key={doc.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleDocClick(doc.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleDocClick(doc.id);
                      }
                    }}
                    sx={{
                      px: 1,
                      py: 0.5,
                      mx: 0.25,
                      borderRadius: 0.75,
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      lineHeight: 1.4,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive
                        ? theme.palette.text.primary
                        : theme.palette.text.secondary,
                      bgcolor: isActive
                        ? alpha(theme.palette.primary.main, isDark ? 0.1 : 0.07)
                        : 'transparent',
                      borderLeft: isActive
                        ? `2px solid ${theme.palette.primary.main}`
                        : '2px solid transparent',
                      '&:hover': {
                        bgcolor: isActive
                          ? alpha(
                              theme.palette.primary.main,
                              isDark ? 0.13 : 0.09,
                            )
                          : alpha(theme.palette.action.hover, 0.4),
                        color: theme.palette.text.primary,
                      },
                      transition: 'all 0.12s ease',
                    }}
                  >
                    {doc.title}
                  </Box>
                );
              })}
            </Box>
          ))}

          {filteredDocs.length === 0 && (
            <Typography
              variant="body2"
              sx={{
                px: 1.5,
                py: 3,
                color: 'text.disabled',
                textAlign: 'center',
                fontSize: '0.8rem',
              }}
            >
              No docs match "{search}"
            </Typography>
          )}
        </Box>
      </Box>

      {/* Document Content */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          overflow: 'auto',
          pl: 4,
          pr: 2,
          pb: 8,
        }}
      >
        {activeDoc ? (
          <>
            {/* Breadcrumb */}
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: 'text.disabled',
                fontSize: '0.6875rem',
                fontWeight: 500,
                mb: 0.5,
                letterSpacing: '0.02em',
              }}
            >
              {activeCategory}
            </Typography>

            <Box
              className="docs-markdown"
              sx={{
                maxWidth: 720,
                color: 'text.primary',

                '& h1': {
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  color: 'text.primary',
                  mb: 2,
                  mt: 0,
                  pb: 1.5,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                  letterSpacing: '-0.01em',
                },

                '& h2': {
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: 'text.primary',
                  mt: 3.5,
                  mb: 1,
                  pb: 0.5,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                  letterSpacing: '-0.005em',
                },

                '& h3': {
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: 'text.primary',
                  mt: 2.5,
                  mb: 0.75,
                },

                '& p': {
                  fontSize: '0.8125rem',
                  lineHeight: 1.75,
                  color: theme.palette.text.secondary,
                  mb: 1.25,
                },

                '& ul, & ol': {
                  fontSize: '0.8125rem',
                  lineHeight: 1.75,
                  color: theme.palette.text.secondary,
                  pl: 2.5,
                  mb: 1.25,
                },

                '& li': {
                  mb: 0.375,
                  '&::marker': {
                    color: alpha(theme.palette.text.secondary, 0.5),
                  },
                },

                '& code': {
                  fontFamily:
                    '"SF Mono", "Fira Code", "Cascadia Code", monospace',
                  fontSize: '0.75rem',
                  bgcolor: alpha(
                    theme.palette.primary.main,
                    isDark ? 0.08 : 0.06,
                  ),
                  color: theme.palette.primary.main,
                  px: 0.625,
                  py: 0.125,
                  borderRadius: 0.5,
                  fontWeight: 500,
                },

                '& pre': {
                  bgcolor: isDark
                    ? alpha(theme.palette.common.black, 0.35)
                    : alpha(theme.palette.common.black, 0.03),
                  borderRadius: 1.5,
                  p: 2,
                  overflow: 'auto',
                  mb: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                  '& code': {
                    bgcolor: 'transparent',
                    color: theme.palette.text.primary,
                    px: 0,
                    py: 0,
                    fontSize: '0.75rem',
                    fontWeight: 400,
                  },
                },

                '& table': {
                  width: '100%',
                  borderCollapse: 'separate',
                  borderSpacing: 0,
                  fontSize: '0.8rem',
                  mb: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                  borderRadius: '8px',
                  overflow: 'hidden',
                },

                '& thead': {
                  bgcolor: alpha(
                    theme.palette.text.primary,
                    isDark ? 0.04 : 0.03,
                  ),
                },

                '& th': {
                  textAlign: 'left',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  color: 'text.primary',
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                  py: 0.875,
                  px: 1.5,
                  letterSpacing: '0.01em',
                },

                '& td': {
                  color: theme.palette.text.secondary,
                  fontSize: '0.8rem',
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                  py: 0.75,
                  px: 1.5,
                  verticalAlign: 'top',
                },

                '& tr:last-child td': {
                  borderBottom: 'none',
                },

                '& tbody tr:hover': {
                  bgcolor: alpha(
                    theme.palette.action.hover,
                    isDark ? 0.15 : 0.3,
                  ),
                },

                '& blockquote': {
                  borderLeft: `3px solid ${theme.palette.primary.main}`,
                  bgcolor: alpha(
                    theme.palette.primary.main,
                    isDark ? 0.05 : 0.03,
                  ),
                  mx: 0,
                  my: 1.5,
                  px: 2,
                  py: 1,
                  borderRadius: '0 8px 8px 0',
                  '& p': {
                    mb: 0.25,
                    color: theme.palette.text.secondary,
                    '&:last-child': { mb: 0 },
                  },
                },

                '& hr': {
                  border: 'none',
                  borderTop: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
                  my: 3,
                },

                '& a': {
                  color: theme.palette.primary.main,
                  textDecoration: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                },

                '& strong': {
                  fontWeight: 600,
                  color: 'text.primary',
                },
              }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {renderedContent}
              </ReactMarkdown>
            </Box>
          </>
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'text.disabled',
            }}
          >
            <Typography>Select a document from the sidebar</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

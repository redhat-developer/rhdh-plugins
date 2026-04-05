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
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { alpha, useTheme } from '@mui/material/styles';
import type { KagentiMcpToolSchema } from '@red-hat-developer-hub/backstage-plugin-augment-common';

export interface McpToolCatalogProps {
  tools: KagentiMcpToolSchema[];
  onInvoke?: (toolName: string, inputSchema?: Record<string, unknown>) => void;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function normalizeRequired(inputSchema: Record<string, unknown>): string[] {
  const req = inputSchema.required;
  if (!Array.isArray(req)) return [];
  return req.filter((x): x is string => typeof x === 'string');
}

function formatJsonSchemaType(prop: Record<string, unknown>): string {
  const t = prop.type;
  if (typeof t === 'string') return t;
  if (Array.isArray(t) && t.every(x => typeof x === 'string')) {
    return t.join(' | ');
  }
  if (prop.enum !== undefined) return 'enum';
  if (prop.const !== undefined) return 'const';
  if (prop.properties !== undefined || prop.items !== undefined)
    return 'object';
  return 'any';
}

function propertyDescription(prop: Record<string, unknown>): string {
  const d = prop.description;
  return typeof d === 'string' ? d : '—';
}

const MONO_FALLBACK =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace';

export function McpToolCatalog({ tools, onInvoke }: McpToolCatalogProps) {
  const theme = useTheme();
  const mono =
    (theme.typography as { fontFamilyMono?: string }).fontFamilyMono ??
    MONO_FALLBACK;

  if (!tools.length) {
    return (
      <Box
        sx={{
          py: 4,
          px: 2,
          textAlign: 'center',
          borderRadius: 1,
          border: `1px dashed ${alpha(theme.palette.divider, 0.6)}`,
          bgcolor: alpha(theme.palette.action.hover, 0.04),
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No MCP tools to display. Run discover to load tool schemas from the
          server.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      {tools.map((tool, idx) => {
        const schema = tool.input_schema;
        const properties =
          schema && isPlainObject(schema.properties) ? schema.properties : null;
        const requiredSet = new Set(schema ? normalizeRequired(schema) : []);
        const propertyEntries = properties ? Object.entries(properties) : [];

        return (
          <Accordion
            key={`${tool.name}-${idx}`}
            disableGutters
            elevation={0}
            sx={{
              border: `1px solid ${alpha(theme.palette.divider, 0.85)}`,
              borderRadius: `${theme.shape.borderRadius}px !important`,
              overflow: 'hidden',
              '&:before': { display: 'none' },
              bgcolor: alpha(theme.palette.background.paper, 1),
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon fontSize="small" />}
              sx={{
                minHeight: 48,
                px: 1.5,
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                '&.Mui-expanded': { minHeight: 48 },
                '& .MuiAccordionSummary-content': {
                  alignItems: 'center',
                  gap: 1,
                  my: 1,
                },
              }}
            >
              <Typography
                component="span"
                variant="subtitle2"
                sx={{
                  fontFamily: mono,
                  fontWeight: 700,
                  flex: 1,
                  minWidth: 0,
                  wordBreak: 'break-all',
                }}
              >
                {tool.name}
              </Typography>
              {onInvoke ? (
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  startIcon={<PlayCircleOutlineIcon fontSize="small" />}
                  onClick={e => {
                    e.stopPropagation();
                    onInvoke(tool.name, tool.input_schema ?? undefined);
                  }}
                  sx={{ textTransform: 'none', flexShrink: 0 }}
                >
                  Invoke
                </Button>
              ) : null}
            </AccordionSummary>
            <AccordionDetails
              sx={{
                px: 1.5,
                pb: 2,
                pt: 0,
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                bgcolor: alpha(theme.palette.action.hover, 0.02),
              }}
            >
              {tool.description ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: propertyEntries.length ? 1.5 : 0, mt: 1.5 }}
                >
                  {tool.description}
                </Typography>
              ) : null}

              {schema && propertyEntries.length > 0 ? (
                <Table size="small" sx={{ mt: tool.description ? 0 : 1.5 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Required</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        Description
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {propertyEntries.map(([propName, raw]) => {
                      const prop = isPlainObject(raw) ? raw : {};
                      const isReq = requiredSet.has(propName);
                      return (
                        <TableRow
                          key={propName}
                          sx={{
                            '&:nth-of-type(odd)': {
                              bgcolor: alpha(theme.palette.action.hover, 0.06),
                            },
                          }}
                        >
                          <TableCell
                            sx={{
                              fontFamily: mono,
                              fontWeight: 500,
                              verticalAlign: 'top',
                            }}
                          >
                            {propName}
                          </TableCell>
                          <TableCell
                            sx={{
                              fontFamily: mono,
                              fontSize: theme.typography.caption.fontSize,
                              verticalAlign: 'top',
                            }}
                          >
                            {formatJsonSchemaType(prop)}
                          </TableCell>
                          <TableCell sx={{ verticalAlign: 'top' }}>
                            {isReq ? (
                              <Chip
                                label="Required"
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            ) : (
                              <Chip
                                label="Optional"
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </TableCell>
                          <TableCell
                            sx={{
                              verticalAlign: 'top',
                              color: 'text.secondary',
                              fontSize: theme.typography.body2.fontSize,
                            }}
                          >
                            {propertyDescription(prop)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : null}

              {schema && !propertyEntries.length ? (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mt: tool.description ? 1 : 1.5 }}
                >
                  No input parameters defined for this tool.
                </Typography>
              ) : null}

              {!schema ? (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mt: tool.description ? 1 : 1.5 }}
                >
                  No input schema provided.
                </Typography>
              ) : null}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
}

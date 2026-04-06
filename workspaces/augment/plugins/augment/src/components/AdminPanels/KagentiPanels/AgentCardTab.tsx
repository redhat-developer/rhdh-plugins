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
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';
import { useTheme, alpha } from '@mui/material/styles';
import StreamIcon from '@mui/icons-material/Stream';
import type { KagentiAgentCard } from '@red-hat-developer-hub/backstage-plugin-augment-common';

export interface AgentCardTabProps {
  agentCard: KagentiAgentCard | null;
  loading: boolean;
}

export function AgentCardTab({ agentCard, loading }: AgentCardTabProps) {
  const theme = useTheme();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Skeleton variant="rounded" height={120} />
        <Skeleton variant="rounded" height={80} />
      </Box>
    );
  }

  if (!agentCard) {
    return (
      <Card variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.disabled }}
        >
          No agent card available. The agent may not expose an A2A agent card
          endpoint, or it has not been fetched yet.
        </Typography>
      </Card>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: 3,
      }}
    >
      <Card variant="outlined" sx={{ p: 2.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
          Basic Information
        </Typography>
        <Table size="small">
          <TableBody>
            <TableRow sx={{ '& td': { border: 'none', py: 0.75 } }}>
              <TableCell
                sx={{
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  width: 100,
                }}
              >
                Name
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{agentCard.name}</TableCell>
            </TableRow>
            <TableRow sx={{ '& td': { border: 'none', py: 0.75 } }}>
              <TableCell sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                Version
              </TableCell>
              <TableCell>
                <Chip
                  label={agentCard.version || '0.0.0'}
                  size="small"
                  variant="outlined"
                  sx={{ height: 22, fontSize: '0.75rem' }}
                />
              </TableCell>
            </TableRow>
            <TableRow sx={{ '& td': { border: 'none', py: 0.75 } }}>
              <TableCell sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                URL
              </TableCell>
              <TableCell
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  wordBreak: 'break-all',
                }}
              >
                {agentCard.url || '\u2014'}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>

      <Card variant="outlined" sx={{ p: 2.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
          Capabilities
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary }}
          >
            Streaming
          </Typography>
          <Chip
            icon={<StreamIcon sx={{ fontSize: '14px !important' }} />}
            label={agentCard.streaming ? 'Enabled' : 'Disabled'}
            size="small"
            color={agentCard.streaming ? 'success' : 'default'}
            sx={{ height: 22 }}
          />
        </Box>
        {agentCard.defaultInputModes && agentCard.defaultInputModes.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary }}
            >
              Input modes
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {agentCard.defaultInputModes.map((mode: string) => (
                <Chip
                  key={mode}
                  label={mode}
                  size="small"
                  variant="outlined"
                  sx={{ height: 22 }}
                />
              ))}
            </Box>
          </Box>
        )}
      </Card>

      {agentCard.description && (
        <Card variant="outlined" sx={{ p: 2.5, gridColumn: { md: '1 / -1' } }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Description
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary }}
          >
            {agentCard.description}
          </Typography>
        </Card>
      )}

      {agentCard.skills && agentCard.skills.length > 0 && (
        <Card variant="outlined" sx={{ p: 2.5, gridColumn: { md: '1 / -1' } }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
            Skills ({agentCard.skills.length})
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                lg: '1fr 1fr 1fr',
              },
              gap: 2,
            }}
          >
            {agentCard.skills.map(
              (
                skill: {
                  id?: string;
                  name?: string;
                  description?: string;
                  tags?: string[];
                },
                idx: number,
              ) => (
                <Card
                  key={skill.id || idx}
                  variant="outlined"
                  sx={{
                    p: 2,
                    bgcolor: alpha(theme.palette.background.paper, 0.5),
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {skill.name || skill.id || `Skill ${idx + 1}`}
                  </Typography>
                  {skill.description && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.text.secondary,
                        display: 'block',
                      }}
                    >
                      {skill.description}
                    </Typography>
                  )}
                  {skill.tags && skill.tags.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                      {skill.tags.map((tag: string) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.65rem' }}
                        />
                      ))}
                    </Box>
                  )}
                </Card>
              ),
            )}
          </Box>
        </Card>
      )}
    </Box>
  );
}

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

import { useMemo, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import { useTheme, alpha } from '@mui/material/styles';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import type {
  KagentiAgentCard,
  KagentiAgentDetail,
  KagentiAgentSummary,
  KagentiRouteStatus,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';

export interface AgentDetailsTabProps {
  agent: KagentiAgentSummary;
  agentDetail: (KagentiAgentDetail & { agentCard?: KagentiAgentCard }) | null;
  loading: boolean;
  routeStatus: KagentiRouteStatus | null;
  copied: boolean;
  onCopy: (text: string) => void;
}

export function AgentDetailsTab({
  agent,
  agentDetail,
  loading,
  routeStatus,
  copied,
  onCopy,
}: AgentDetailsTabProps) {
  const theme = useTheme();
  const agentUrl = agentDetail?.agentCard?.url || routeStatus?.url;

  const infoRows = useMemo(() => {
    const rows: Array<{ label: string; value: ReactNode }> = [
      { label: 'Name', value: agent.name },
      { label: 'Namespace', value: agent.namespace },
      { label: 'Description', value: agent.description || '—' },
      {
        label: 'Workload Type',
        value: (
          <Chip
            label={agent.workloadType ?? 'Deployment'}
            size="small"
            variant="outlined"
            sx={{ height: 24 }}
          />
        ),
      },
    ];
    const meta = agentDetail?.metadata as Record<string, unknown> | undefined;
    const statusObj = agentDetail?.status as
      | Record<string, unknown>
      | undefined;
    if (statusObj?.replicas !== undefined) {
      const avail = statusObj.availableReplicas ?? statusObj.readyReplicas ?? 0;
      rows.push({
        label: 'Replicas',
        value: `${avail}/${statusObj.replicas} ready (${avail} available)`,
      });
    }
    if (agent.createdAt) {
      rows.push({
        label: 'Created',
        value: new Date(agent.createdAt).toLocaleString(),
      });
    }
    if (meta?.uid) {
      rows.push({
        label: 'UID',
        value: (
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              wordBreak: 'break-all',
            }}
          >
            {String(meta.uid)}
          </Typography>
        ),
      });
    }
    return rows;
  }, [agent, agentDetail]);

  const endpointRows = useMemo(() => {
    const rows: Array<{ label: string; value: ReactNode }> = [];
    if (agentUrl) {
      rows.push({
        label: 'Agent URL',
        value: (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                bgcolor: alpha(theme.palette.action.hover, 0.3),
                px: 1,
                py: 0.25,
                borderRadius: 0.5,
              }}
            >
              {agentUrl}
            </Typography>
            <IconButton
              size="small"
              onClick={() => onCopy(agentUrl)}
              title={copied ? 'Copied!' : 'Copy'}
            >
              <ContentCopyIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        ),
      });
    }
    const svc = agentDetail?.service as Record<string, unknown> | undefined;
    if (svc) {
      if (svc.type)
        rows.push({ label: 'Service', value: `${agent.name} (${svc.type})` });
      if (svc.clusterIP) {
        rows.push({
          label: 'Cluster IP',
          value: (
            <Typography
              variant="body2"
              sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
            >
              {String(svc.clusterIP)}
            </Typography>
          ),
        });
      }
      const ports = svc.ports as
        | Array<{ port?: number; protocol?: string }>
        | undefined;
      if (ports && ports.length > 0) {
        rows.push({
          label: 'Ports',
          value: (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {ports.map((p, i) => (
                <Chip
                  key={i}
                  label={`${p.protocol ?? 'http'}:${p.port}`}
                  size="small"
                  variant="outlined"
                  sx={{
                    height: 24,
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                  }}
                />
              ))}
            </Box>
          ),
        });
      }
    }
    if (routeStatus) {
      Object.entries(routeStatus).forEach(([key, val]) => {
        if (key === 'url') return;
        if (val !== undefined && val !== null) {
          rows.push({
            label: key.charAt(0).toUpperCase() + key.slice(1),
            value: typeof val === 'object' ? JSON.stringify(val) : String(val),
          });
        }
      });
    }
    return rows;
  }, [agentUrl, agentDetail, routeStatus, copied, theme, agent.name, onCopy]);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: 3,
      }}
    >
      <Card variant="outlined" sx={{ p: 2.5 }}>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}
        >
          Agent Information
        </Typography>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="text" width="80%" />
            ))}
          </Box>
        ) : (
          <Table size="small">
            <TableBody>
              {infoRows.map(row => (
                <TableRow
                  key={row.label}
                  sx={{ '&:last-child td': { borderBottom: 0 } }}
                >
                  <TableCell
                    sx={{
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                      fontSize: '0.8125rem',
                      width: 140,
                      border: 'none',
                      py: 1,
                    }}
                  >
                    {row.label}
                  </TableCell>
                  <TableCell
                    sx={{ fontSize: '0.8125rem', border: 'none', py: 1 }}
                  >
                    {row.value}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card variant="outlined" sx={{ p: 2.5 }}>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}
        >
          Endpoint
        </Typography>
        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Skeleton variant="text" width="90%" />
            <Skeleton variant="text" width="60%" />
          </Box>
        )}
        {!loading && endpointRows.length > 0 && (
          <Table size="small">
            <TableBody>
              {endpointRows.map(row => (
                <TableRow
                  key={row.label}
                  sx={{ '&:last-child td': { borderBottom: 0 } }}
                >
                  <TableCell
                    sx={{
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                      fontSize: '0.8125rem',
                      width: 120,
                      border: 'none',
                      py: 1,
                      verticalAlign: 'top',
                    }}
                  >
                    {row.label}
                  </TableCell>
                  <TableCell
                    sx={{ fontSize: '0.8125rem', border: 'none', py: 1 }}
                  >
                    {row.value}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!loading && endpointRows.length === 0 && (
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.disabled }}
          >
            No endpoint information available
          </Typography>
        )}
      </Card>

    </Box>
  );
}

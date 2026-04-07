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

import { useEffect, useState } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Alert from '@mui/material/Alert';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme, alpha } from '@mui/material/styles';
import type {
  KagentiMcpToolSchema,
  KagentiToolSummary,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { augmentApiRef } from '../../../api';
import { getErrorMessage } from '../../../utils';
import { PropertyRow } from './KagentiPropertyRow';
import { ToolBuildSection } from './ToolBuildSection';
import { ToolMcpSection } from './ToolMcpSection';
import { ToolRouteSection } from './ToolRouteSection';
import { ToolSpecSection } from './ToolSpecSection';
import {
  formatDateTime,
  toolSummaryStatusChipColor,
} from './kagentiDisplayUtils';
import { useKagentiToolDetail } from './useKagentiToolDetail';
import { useToolInvoke } from './useToolInvoke';

export interface KagentiToolDetailDrawerProps {
  open: boolean;
  tool: KagentiToolSummary | null;
  onClose: () => void;
}

export function KagentiToolDetailDrawer({
  open,
  tool,
  onClose,
}: KagentiToolDetailDrawerProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const api = useApi(augmentApiRef);

  const detailState = useKagentiToolDetail(open, tool, api);
  const invoke = useToolInvoke(api);
  const { resetInvoke } = invoke;

  const [mcpTools, setMcpTools] = useState<KagentiMcpToolSchema[]>([]);
  const [mcpDiscovering, setMcpDiscovering] = useState(false);
  const [mcpError, setMcpError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !tool) {
      setMcpTools([]);
      setMcpDiscovering(false);
      setMcpError(null);
      resetInvoke();
    }
  }, [open, tool, resetInvoke]);

  const handleDiscoverMcp = async () => {
    if (!tool) return;
    setMcpDiscovering(true);
    setMcpError(null);
    try {
      const res = await api.connectKagentiTool(tool.namespace, tool.name);
      setMcpTools(res.tools ?? []);
    } catch (e) {
      setMcpError(getErrorMessage(e));
    } finally {
      setMcpDiscovering(false);
    }
  };

  if (!tool) {
    return null;
  }

  const spec = detailState.detail?.spec as Record<string, unknown> | undefined;

  const overviewWorkload =
    detailState.detail?.workloadType ?? tool.workloadType ?? '—';
  const overviewDescription = tool.description || '—';
  const labelEntries = Object.entries(tool.labels ?? {}).filter(([, v]) => v);

  const sectionCardSx = {
    mb: 2,
    border: 1,
    borderColor: 'divider',
    borderRadius: 1,
    bgcolor: alpha(theme.palette.background.paper, isDark ? 0.35 : 0.65),
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 520,
          maxWidth: '92vw',
          display: 'flex',
          flexDirection: 'column',
          p: 0,
        },
      }}
    >
      <Box
        sx={{
          px: 2.5,
          pt: 2.5,
          pb: 2,
          borderBottom: 1,
          borderColor: 'divider',
          position: 'relative',
          background: isDark
            ? alpha(theme.palette.primary.main, 0.08)
            : alpha(theme.palette.primary.main, 0.04),
        }}
      >
        <IconButton
          onClick={onClose}
          size="small"
          aria-label="Close"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            color: theme.palette.text.secondary,
          }}
        >
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, fontSize: '1.1rem', pr: 4 }}
        >
          {tool.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {tool.namespace}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.75,
            alignItems: 'center',
          }}
        >
          <Chip
            label={tool.status}
            size="small"
            color={toolSummaryStatusChipColor(tool.status)}
            sx={{ height: 24 }}
          />
          {tool.labels?.protocol && (
            <Chip
              label={[tool.labels.protocol].flat().join(', ').toUpperCase()}
              size="small"
              variant="outlined"
              sx={{ height: 24, fontWeight: 600 }}
            />
          )}
          {tool.labels?.framework && (
            <Chip
              label={tool.labels.framework}
              size="small"
              variant="outlined"
              sx={{ height: 24 }}
            />
          )}
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Card variant="outlined" sx={sectionCardSx}>
          <CardContent sx={{ pb: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Overview
            </Typography>
            <PropertyRow label="Description" value={overviewDescription} />
            <PropertyRow label="Workload type" value={overviewWorkload} />
            <Box sx={{ mb: 1 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}
              >
                Labels
              </Typography>
              {labelEntries.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  —
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {labelEntries.map(([k, v]) => (
                    <Chip
                      key={k}
                      label={`${k}: ${v}`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              )}
            </Box>
            <PropertyRow
              label="Created at"
              value={formatDateTime(tool.createdAt)}
            />
          </CardContent>
        </Card>

        <Card variant="outlined" sx={sectionCardSx}>
          <CardContent sx={{ pb: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Route status
            </Typography>
            <ToolRouteSection
              routeLoading={detailState.routeLoading}
              routeError={detailState.routeError}
              routeStatus={detailState.routeStatus}
            />
          </CardContent>
        </Card>

        <Card variant="outlined" sx={sectionCardSx}>
          <CardContent sx={{ pb: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Spec
            </Typography>
            <ToolSpecSection
              detailLoading={detailState.detailLoading}
              detailError={detailState.detailError}
              spec={spec}
            />
          </CardContent>
        </Card>

        {detailState.hasBuild !== false && (
          <Card variant="outlined" sx={sectionCardSx}>
            <CardContent sx={{ pb: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                Build pipeline
              </Typography>
              {detailState.buildActionError && (
                <Alert
                  severity="error"
                  sx={{ mb: 1.5 }}
                  onClose={() => detailState.setBuildActionError(null)}
                >
                  {detailState.buildActionError}
                </Alert>
              )}
              <ToolBuildSection
                buildLoading={detailState.buildLoading}
                buildFetchFailed={detailState.buildFetchFailed}
                buildInfo={detailState.buildInfo}
                triggeringBuild={detailState.triggeringBuild}
                finalizingBuild={detailState.finalizingBuild}
                onTriggerBuild={detailState.handleTriggerBuild}
                onFinalizeBuild={detailState.handleFinalizeBuild}
              />
            </CardContent>
          </Card>
        )}

        <Card variant="outlined" sx={sectionCardSx}>
          <CardContent sx={{ pb: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              MCP tools
            </Typography>
            <ToolMcpSection
              tool={tool}
              mcpTools={mcpTools}
              mcpDiscovering={mcpDiscovering}
              mcpError={mcpError}
              onDiscover={handleDiscoverMcp}
              onDismissMcpError={() => setMcpError(null)}
              invoke={invoke}
            />
          </CardContent>
        </Card>
      </Box>
    </Drawer>
  );
}

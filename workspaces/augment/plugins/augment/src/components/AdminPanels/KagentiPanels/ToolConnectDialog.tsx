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
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import { alpha, useTheme } from '@mui/material/styles';
import type {
  KagentiMcpToolSchema,
  KagentiToolSummary,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { AugmentApi } from '../../../api';
import { getErrorMessage } from '../../../utils';
import { McpToolCatalog } from './McpToolCatalog';
import { toolSummaryStatusChipColor } from './kagentiDisplayUtils';

export interface ToolConnectDialogProps {
  open: boolean;
  tool: KagentiToolSummary | null;
  onClose: () => void;
  onInvoke: (toolName: string, inputSchema?: Record<string, unknown>) => void;
  api: AugmentApi;
}

export function ToolConnectDialog({
  open,
  tool,
  onClose,
  onInvoke,
  api,
}: ToolConnectDialogProps) {
  const theme = useTheme();
  const [connecting, setConnecting] = useState(false);
  const [connectedSchemas, setConnectedSchemas] = useState<
    KagentiMcpToolSchema[] | null
  >(null);
  const [discoverError, setDiscoverError] = useState<string | null>(null);

  const runDiscover = async () => {
    if (!tool) return;
    setConnecting(true);
    setDiscoverError(null);
    try {
      const res = await api.connectKagentiTool(tool.namespace, tool.name);
      setConnectedSchemas(res.tools ?? []);
    } catch (e) {
      setDiscoverError(getErrorMessage(e));
    } finally {
      setConnecting(false);
    }
  };

  useEffect(() => {
    if (open && tool) {
      setConnectedSchemas(null);
      setDiscoverError(null);
      runDiscover();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tool?.namespace, tool?.name]);

  const toolCount = connectedSchemas?.length ?? 0;

  return (
    <Dialog
      open={open}
      onClose={() => !connecting && onClose()}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, overflow: 'hidden' },
      }}
    >
      <Box
        sx={{
          px: 3,
          pt: 2.5,
          pb: 2,
          background: alpha(theme.palette.primary.main, 0.04),
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            mb: 0.75,
          }}
        >
          <ExtensionOutlinedIcon
            sx={{ fontSize: 22, color: theme.palette.primary.main }}
          />
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', color: 'text.primary' }}>
            MCP Tool Discovery
          </Typography>
          {tool && (
            <Chip
              label={tool.status}
              size="small"
              color={toolSummaryStatusChipColor(tool.status)}
              sx={{ height: 24, ml: 'auto' }}
            />
          )}
        </Box>
        {tool && (
          <Typography variant="body2" color="text.secondary">
            Connecting to{' '}
            <Typography
              component="span"
              variant="body2"
              sx={{ fontWeight: 600 }}
            >
              {tool.name}
            </Typography>{' '}
            in{' '}
            <Typography
              component="span"
              variant="body2"
              sx={{ fontWeight: 600 }}
            >
              {tool.namespace}
            </Typography>{' '}
            to list the MCP tools it exposes.
          </Typography>
        )}
      </Box>

      <DialogContent sx={{ px: 3, pt: 2.5, pb: 3 }}>
        {connecting && !connectedSchemas && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.5,
              py: 5,
            }}
          >
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary">
              Connecting to the MCP server...
            </Typography>
          </Box>
        )}

        {discoverError && (
          <Alert
            severity="error"
            sx={{ mb: 2, borderRadius: 1 }}
            onClose={() => setDiscoverError(null)}
          >
            {discoverError}
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
              {tool?.name?.endsWith('-mcp')
                ? `The platform appends "-mcp" to the service name internally. Because this tool is named "${tool.name}", it may be looking for a service called "${tool.name}-mcp" which does not exist. Try recreating the tool without the "-mcp" suffix.`
                : 'The tool may still be starting up, or its MCP endpoint may not be reachable. Verify the tool is in Ready status and try again.'}
            </Typography>
          </Alert>
        )}

        {!connecting && discoverError && (
          <Button
            variant="outlined"
            size="small"
            onClick={runDiscover}
            startIcon={<RefreshIcon fontSize="small" />}
            sx={{ textTransform: 'none', mb: 2 }}
          >
            Retry discovery
          </Button>
        )}

        {!connecting && connectedSchemas !== null && !discoverError && (
          <>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1.5,
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {toolCount > 0
                  ? `${toolCount} tool${toolCount > 1 ? 's' : ''} discovered`
                  : 'No tools discovered'}
              </Typography>
              <Button
                size="small"
                onClick={runDiscover}
                disabled={connecting}
                startIcon={<RefreshIcon fontSize="small" />}
                sx={{ textTransform: 'none' }}
              >
                Refresh
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
          </>
        )}

        {connectedSchemas !== null && (
          <McpToolCatalog tools={connectedSchemas} onInvoke={onInvoke} />
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ textTransform: 'none' }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

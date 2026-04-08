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
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
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

  return (
    <Dialog
      open={open}
      onClose={() => !connecting && onClose()}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          Discover MCP tools
          {tool && (
            <Chip
              label={tool.status}
              size="small"
              color={toolSummaryStatusChipColor(tool.status)}
              sx={{ height: 22 }}
            />
          )}
        </Box>
        <Typography variant="body2" color="text.secondary">
          Connect to {tool ? `${tool.namespace}/${tool.name}` : ''} and list the
          MCP tools it exposes.
        </Typography>
      </DialogTitle>
      <DialogContent>
        {connecting && !connectedSchemas && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Connecting to the MCP server...
            </Typography>
          </Box>
        )}
        {discoverError && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
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
            sx={{ textTransform: 'none', mb: 2 }}
          >
            Retry
          </Button>
        )}
        {connectedSchemas !== null && (
          <McpToolCatalog tools={connectedSchemas} onInvoke={onInvoke} />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

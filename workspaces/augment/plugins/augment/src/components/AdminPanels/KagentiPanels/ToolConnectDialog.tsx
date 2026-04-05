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
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import type {
  KagentiMcpToolSchema,
  KagentiToolSummary,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { AugmentApi } from '../../../api';
import { getErrorMessage } from '../../../utils';
import { McpToolCatalog } from './McpToolCatalog';

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

  useEffect(() => {
    if (open) {
      setConnectedSchemas(null);
      setDiscoverError(null);
    }
  }, [open, tool]);

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

  return (
    <Dialog
      open={open}
      onClose={() => !connecting && onClose()}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Discover MCP tools — {tool ? `${tool.namespace}/${tool.name}` : ''}
      </DialogTitle>
      <DialogContent>
        {discoverError && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            onClose={() => setDiscoverError(null)}
          >
            {discoverError}
          </Alert>
        )}
        <Button
          variant="outlined"
          size="small"
          onClick={runDiscover}
          disabled={connecting}
          sx={{ textTransform: 'none', mb: 2 }}
        >
          {connecting ? <CircularProgress size={20} /> : 'Discover MCP tools'}
        </Button>
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

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
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import { alpha, useTheme } from '@mui/material/styles';
import type {
  KagentiMcpToolSchema,
  KagentiToolSummary,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { McpToolCatalog } from './McpToolCatalog';
import { SchemaInvokeForm } from './SchemaInvokeForm';
import type { UseToolInvokeResult } from './useToolInvoke';

export interface ToolMcpSectionProps {
  tool: KagentiToolSummary;
  mcpTools: KagentiMcpToolSchema[];
  mcpDiscovering: boolean;
  mcpError: string | null;
  onDiscover: () => void;
  onDismissMcpError: () => void;
  invoke: UseToolInvokeResult;
}

export function ToolMcpSection({
  tool,
  mcpTools,
  mcpDiscovering,
  mcpError,
  onDiscover,
  onDismissMcpError,
  invoke,
}: ToolMcpSectionProps) {
  const theme = useTheme();
  const {
    invokeOpen,
    invokeToolName,
    setInvokeToolName,
    invokeArgsJson,
    setInvokeArgsJson,
    invokeResult,
    invokeError,
    invoking,
    invokeSchema,
    handleStartInvoke,
    handleInvoke,
    invokeWithArgs,
    setInvokeError,
    setInvokeResult,
    setInvokeOpen,
  } = invoke;

  const closeInvokePanel = () => {
    setInvokeOpen(false);
    setInvokeResult(null);
    setInvokeError(null);
  };

  const hasTools = mcpTools.length > 0;

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ExtensionOutlinedIcon
            sx={{ fontSize: 18, color: theme.palette.text.secondary }}
          />
          <Typography variant="body2" color="text.secondary">
            {hasTools
              ? `${mcpTools.length} tool${mcpTools.length > 1 ? 's' : ''} discovered`
              : 'Connect to discover available tools'}
          </Typography>
        </Box>
        <Button
          size="small"
          onClick={onDiscover}
          disabled={mcpDiscovering}
          startIcon={
            mcpDiscovering ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <RefreshIcon fontSize="small" />
            )
          }
          sx={{ textTransform: 'none', minWidth: 0 }}
        >
          {mcpDiscovering ? 'Discovering...' : hasTools ? 'Refresh' : 'Discover'}
        </Button>
      </Box>

      {mcpError && (
        <Alert
          severity="error"
          sx={{ mb: 1.5, borderRadius: 1 }}
          onClose={onDismissMcpError}
        >
          {mcpError}
          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
            {tool.name.endsWith('-mcp')
              ? `The platform appends "-mcp" to the service name internally. Because this tool is named "${tool.name}", it may be looking for a service called "${tool.name}-mcp" which does not exist. Try recreating the tool without the "-mcp" suffix.`
              : 'The tool may still be starting up, or its MCP endpoint may not be reachable. Verify the tool is in Ready status and try again.'}
          </Typography>
        </Alert>
      )}

      {hasTools && <Divider sx={{ mb: 1.5 }} />}

      <McpToolCatalog tools={mcpTools} onInvoke={handleStartInvoke} />

      {invokeOpen && (
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 1,
            border: 1,
            borderColor: 'divider',
            bgcolor: alpha(theme.palette.action.hover, 0.06),
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Invoke: {invokeToolName}
          </Typography>
          {invokeSchema ? (
            <SchemaInvokeForm
              schema={invokeSchema}
              onSubmit={args =>
                invokeWithArgs(tool.namespace, tool.name, invokeToolName, args)
              }
              submitting={invoking}
              result={invokeResult}
              error={invokeError}
              onErrorClear={() => setInvokeError(null)}
              onCancel={closeInvokePanel}
            />
          ) : (
            <>
              <TextField
                label="Tool name"
                size="small"
                value={invokeToolName}
                onChange={e => setInvokeToolName(e.target.value)}
                fullWidth
                sx={{ mb: 1.5 }}
              />
              <TextField
                label="Arguments (JSON)"
                size="small"
                value={invokeArgsJson}
                onChange={e => setInvokeArgsJson(e.target.value)}
                fullWidth
                multiline
                minRows={3}
                sx={{ mb: 1.5 }}
              />
              {invokeError && (
                <Alert
                  severity="error"
                  sx={{ mb: 1 }}
                  onClose={() => setInvokeError(null)}
                >
                  {invokeError}
                </Alert>
              )}
              {invokeResult && (
                <TextField
                  label="Result"
                  size="small"
                  value={invokeResult}
                  fullWidth
                  multiline
                  minRows={4}
                  InputProps={{ readOnly: true }}
                  sx={{ mb: 1.5 }}
                />
              )}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleInvoke(tool.namespace, tool.name)}
                  disabled={invoking || !invokeToolName.trim()}
                  sx={{ textTransform: 'none' }}
                >
                  {invoking ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    'Invoke'
                  )}
                </Button>
                <Button
                  size="small"
                  onClick={closeInvokePanel}
                  disabled={invoking}
                  sx={{ textTransform: 'none' }}
                >
                  Cancel
                </Button>
              </Box>
            </>
          )}
        </Box>
      )}
    </>
  );
}

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
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
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

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        onClick={onDiscover}
        disabled={mcpDiscovering}
        startIcon={
          mcpDiscovering ? (
            <CircularProgress size={18} color="inherit" />
          ) : undefined
        }
        sx={{ textTransform: 'none', mb: 2 }}
      >
        Discover MCP Tools
      </Button>
      {mcpError && (
        <Alert severity="error" sx={{ mb: 1.5 }} onClose={onDismissMcpError}>
          {mcpError}
        </Alert>
      )}
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

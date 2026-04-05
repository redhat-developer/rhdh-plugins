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
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import type { KagentiToolSummary } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { SchemaInvokeForm } from './SchemaInvokeForm';
import type { UseToolInvokeResult } from './useToolInvoke';

export type ToolInvokeDialogProps = {
  invoke: UseToolInvokeResult;
  /** When omitted, the hook’s `invokeTarget` (set by `openInvoke` / `openInvokePrefilled`) is used. */
  tool?: KagentiToolSummary | null;
};

export function ToolInvokeDialog({
  invoke,
  tool = null,
}: ToolInvokeDialogProps) {
  const {
    invokeOpen,
    invokeTarget,
    invokeToolName,
    setInvokeToolName,
    invokeArgsJson,
    setInvokeArgsJson,
    invoking,
    invokeResult,
    invokeError,
    invokeSchema,
    resetInvoke,
    clearInvokeError,
    handleInvoke,
    invokeWithArgs,
  } = invoke;

  const resource = tool ?? invokeTarget;

  return (
    <Dialog
      open={invokeOpen}
      onClose={() => !invoking && resetInvoke()}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Invoke {resource ? `${resource.namespace}/${resource.name}` : ''}
        {invokeToolName ? ` \u2014 ${invokeToolName}` : ''}
      </DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}
      >
        {invokeError && !invokeSchema && (
          <Alert severity="error" onClose={clearInvokeError}>
            {invokeError}
          </Alert>
        )}
        {!invokeToolName && (
          <TextField
            label="Tool name"
            size="small"
            value={invokeToolName}
            onChange={e => setInvokeToolName(e.target.value)}
            fullWidth
            required
          />
        )}
        {invokeSchema ? (
          <SchemaInvokeForm
            schema={invokeSchema}
            onSubmit={args => {
              if (!resource || !invokeToolName.trim()) return;
              invokeWithArgs(
                resource.namespace,
                resource.name,
                invokeToolName.trim(),
                args,
              );
            }}
            submitting={invoking}
            result={invokeResult}
            error={invokeError}
            onErrorClear={clearInvokeError}
            onCancel={resetInvoke}
          />
        ) : (
          <>
            {invokeToolName && (
              <TextField
                label="Tool name"
                size="small"
                value={invokeToolName}
                onChange={e => setInvokeToolName(e.target.value)}
                fullWidth
                required
              />
            )}
            <TextField
              label="Arguments (JSON)"
              size="small"
              value={invokeArgsJson}
              onChange={e => setInvokeArgsJson(e.target.value)}
              fullWidth
              multiline
              minRows={4}
            />
            {invokeResult && (
              <TextField
                label="Result"
                size="small"
                value={invokeResult}
                fullWidth
                multiline
                minRows={6}
                InputProps={{ readOnly: true }}
              />
            )}
          </>
        )}
      </DialogContent>
      {!invokeSchema && (
        <DialogActions>
          <Button
            onClick={resetInvoke}
            disabled={invoking}
            sx={{ textTransform: 'none' }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            onClick={() =>
              resource && handleInvoke(resource.namespace, resource.name)
            }
            disabled={invoking || !invokeToolName.trim() || !resource}
            sx={{ textTransform: 'none' }}
          >
            {invoking ? <CircularProgress size={20} /> : 'Invoke'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

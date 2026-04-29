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
import React, { useState, useEffect, useCallback } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import type { AgentFormData } from './agentValidation';

function normalizeAgentId(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface CreateAgentModalProps {
  open: boolean;
  agents: Record<string, AgentFormData>;
  isFirstAgent: boolean;
  onClose: () => void;
  onCreate: (name: string, id: string) => void;
}

export const CreateAgentModal = React.memo(function CreateAgentModal({
  open,
  agents,
  isFirstAgent,
  onClose,
  onCreate,
}: CreateAgentModalProps) {
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [idManual, setIdManual] = useState(false);

  useEffect(() => {
    if (!idManual) setId(normalizeAgentId(name));
  }, [name, idManual]);

  const handleClose = useCallback(() => {
    onClose();
    setName('');
    setId('');
    setIdManual(false);
  }, [onClose]);

  const handleCreate = useCallback(() => {
    const normalizedId = normalizeAgentId(id);
    if (!normalizedId || agents[normalizedId]) return;
    onCreate(name.trim(), normalizedId);
    setName('');
    setId('');
    setIdManual(false);
  }, [id, name, agents, onCreate]);

  const normalizedId = normalizeAgentId(id);
  const isDuplicate = Boolean(normalizedId && agents[normalizedId]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 0.5 }}>New Agent</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          {isFirstAgent
            ? 'Create your first agent. Its role will be determined automatically from its connections.'
            : 'Add another agent. Its role (Router, Specialist, or Standalone) will be determined automatically based on how you connect it to other agents.'}
        </Typography>
        <TextField
          label="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          fullWidth
          size="small"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          placeholder="e.g. Support Agent"
          sx={{ mb: 2 }}
        />
        <TextField
          label="Agent ID"
          value={id}
          onChange={e => {
            setId(e.target.value);
            setIdManual(true);
          }}
          fullWidth
          size="small"
          helperText={
            isDuplicate
              ? 'This ID already exists.'
              : 'Auto-generated from name.'
          }
          error={isDuplicate}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleCreate}
          disabled={!normalizedId || isDuplicate}
          sx={{ textTransform: 'none' }}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
});

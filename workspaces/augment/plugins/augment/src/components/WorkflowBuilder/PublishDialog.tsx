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

import { useMemo, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import type { WorkflowDefinition } from '@red-hat-developer-hub/backstage-plugin-augment-common';

interface PublishDialogProps {
  open: boolean;
  workflow: WorkflowDefinition;
  onClose: () => void;
  onPublish: (changelog?: string) => Promise<void>;
}

interface ValidationIssue {
  severity: 'error' | 'warning';
  message: string;
}

function validateForPublish(workflow: WorkflowDefinition): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!workflow.name.trim()) {
    issues.push({ severity: 'error', message: 'Workflow must have a name' });
  }

  if (!workflow.nodes || workflow.nodes.length === 0) {
    issues.push({ severity: 'error', message: 'Workflow has no nodes' });
  }

  const hasStart = workflow.nodes.some(n => n.type === 'start');
  if (!hasStart) {
    issues.push({ severity: 'error', message: 'Workflow must have a Start node' });
  }

  const hasAgent = workflow.nodes.some(n => n.type === 'agent');
  if (!hasAgent) {
    issues.push({ severity: 'error', message: 'Workflow must have at least one Agent node' });
  }

  const agentNodes = workflow.nodes.filter(n => n.type === 'agent');
  for (const node of agentNodes) {
    const data = node.data as Record<string, unknown>;
    if (!data.instructions) {
      issues.push({
        severity: 'warning',
        message: `Agent "${data.name || node.id}" has no instructions`,
      });
    }
  }

  if (hasStart) {
    const startNode = workflow.nodes.find(n => n.type === 'start')!;
    const startEdge = workflow.edges.find(e => e.source === startNode.id);
    if (!startEdge) {
      issues.push({ severity: 'error', message: 'Start node is not connected to any agent' });
    }
  }

  return issues;
}

export function PublishDialog({
  open,
  workflow,
  onClose,
  onPublish,
}: PublishDialogProps) {
  const [changelog, setChangelog] = useState('');
  const [publishing, setPublishing] = useState(false);

  const issues = useMemo(() => validateForPublish(workflow), [workflow]);
  const hasErrors = issues.some(i => i.severity === 'error');

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await onPublish(changelog.trim() || undefined);
      setChangelog('');
      onClose();
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Publish Workflow</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Publishing creates an immutable version snapshot that can be used in production.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2">
              Current version: <strong>v{workflow.version}</strong>
            </Typography>
            <Chip label={`Next: v${workflow.version + 1}`} size="small" color="primary" />
          </Box>
        </Box>

        {issues.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              Validation
            </Typography>
            {issues.map((issue, i) => (
              <Alert
                key={i}
                severity={issue.severity}
                icon={issue.severity === 'error' ? <ErrorIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                sx={{ mb: 0.5, py: 0 }}
              >
                {issue.message}
              </Alert>
            ))}
          </Box>
        )}

        {!hasErrors && (
          <TextField
            label="Changelog (optional)"
            fullWidth
            multiline
            minRows={2}
            maxRows={4}
            value={changelog}
            onChange={e => setChangelog(e.target.value)}
            placeholder="Describe what changed in this version..."
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handlePublish}
          disabled={hasErrors || publishing}
        >
          {publishing ? 'Publishing...' : 'Publish'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

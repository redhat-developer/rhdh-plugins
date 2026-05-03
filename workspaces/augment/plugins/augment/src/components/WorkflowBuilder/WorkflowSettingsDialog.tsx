import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Tooltip from '@mui/material/Tooltip';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface Secret {
  name: string;
  value: string;
}

interface WorkflowSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  workflowId: string;
  secrets: Secret[];
  onSecretsChange: (secrets: Secret[]) => void;
}

export function WorkflowSettingsDialog({
  open,
  onClose,
  workflowId,
  secrets,
  onSecretsChange,
}: WorkflowSettingsDialogProps) {
  const [copied, setCopied] = useState(false);

  const copyId = useCallback(() => {
    navigator.clipboard.writeText(workflowId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [workflowId]);

  const addSecret = useCallback(() => {
    onSecretsChange([...secrets, { name: '', value: '' }]);
  }, [secrets, onSecretsChange]);

  const updateSecret = useCallback((index: number, field: keyof Secret, val: string) => {
    const updated = [...secrets];
    updated[index] = { ...updated[index], [field]: val };
    onSecretsChange(updated);
  }, [secrets, onSecretsChange]);

  const removeSecret = useCallback((index: number) => {
    onSecretsChange(secrets.filter((_, i) => i !== index));
  }, [secrets, onSecretsChange]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Typography variant="h6" fontWeight={700}>Workflow settings</Typography>
          <IconButton size="small" onClick={onClose}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
        </Box>

        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>Secrets</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.85rem', lineHeight: 1.5 }}>
          Write-only secrets for this workflow. Refer to them by name in MCP nodes and the Agent
          node MCP tool for authentication and custom headers (for example, {'{{MY_SECRET}}'}).
        </Typography>

        {secrets.length === 0 ? (
          <TextField
            variant="outlined"
            size="small"
            fullWidth
            disabled
            value="No secrets configured yet."
            sx={{ mb: 1.5 }}
          />
        ) : (
          secrets.map((s, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
              <TextField
                variant="standard"
                size="small"
                label="Name"
                value={s.name}
                onChange={e => updateSecret(i, 'name', e.target.value)}
                sx={{ flex: 1 }}
              />
              <TextField
                variant="standard"
                size="small"
                label="Value"
                type="password"
                value={s.value}
                onChange={e => updateSecret(i, 'value', e.target.value)}
                sx={{ flex: 2 }}
              />
              <IconButton size="small" color="error" onClick={() => removeSecret(i)} sx={{ p: 0.25 }}>
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          ))
        )}

        <Button
          size="small"
          onClick={addSecret}
          sx={{ textTransform: 'none', mb: 3 }}
        >
          + Add Secret
        </Button>

        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Workflow ID</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            variant="outlined"
            size="small"
            fullWidth
            value={workflowId}
            InputProps={{ readOnly: true }}
          />
          <Tooltip title={copied ? 'Copied!' : 'Copy'}>
            <IconButton size="small" onClick={copyId}>
              <ContentCopyIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

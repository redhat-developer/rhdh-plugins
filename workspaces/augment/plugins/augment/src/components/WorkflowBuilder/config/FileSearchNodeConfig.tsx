import { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import type { NodeConfigProps } from './types';

export function FileSearchNodeConfig({ nodeData, update }: NodeConfigProps) {
  const vectorStoreIds = Array.isArray(nodeData.vectorStoreIds) ? (nodeData.vectorStoreIds as string[]) : [];
  const [vsInput, setVsInput] = useState('');

  const addVectorStore = () => {
    const trimmed = vsInput.trim();
    if (trimmed && !vectorStoreIds.includes(trimmed)) update('vectorStoreIds', [...vectorStoreIds, trimmed]);
    setVsInput('');
  };

  return (
    <>
      <TextField variant="standard" label="Label" size="small" fullWidth value={(nodeData.label as string) || ''} onChange={e => update('label', e.target.value)} sx={{ mb: 1.5 }} />
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Vector Store IDs</Typography>
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
        {vectorStoreIds.map(id => <Chip key={id} label={id} size="small" onDelete={() => update('vectorStoreIds', vectorStoreIds.filter(v => v !== id))} />)}
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mb: 1.5 }}>
        <TextField variant="standard" label="Add Vector Store ID" size="small" fullWidth value={vsInput} onChange={e => setVsInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addVectorStore(); } }} />
        <Button variant="outlined" size="small" onClick={addVectorStore} sx={{ minWidth: 32, px: 0.5, height: 40 }}>+</Button>
      </Box>
      <TextField variant="standard" label="Max Results" size="small" type="number" fullWidth value={(nodeData.maxResults as number) ?? 10} onChange={e => update('maxResults', parseInt(e.target.value, 10))} sx={{ mb: 1.5 }} inputProps={{ min: 1, max: 50 }} />
      <TextField variant="standard" label="Score Threshold" size="small" type="number" fullWidth value={(nodeData.scoreThreshold as number) ?? ''} onChange={e => update('scoreThreshold', e.target.value ? parseFloat(e.target.value) : undefined)} sx={{ mb: 1.5 }} inputProps={{ min: 0, max: 1, step: 0.05 }} helperText="Minimum similarity score (0-1). Leave empty for no threshold." />
    </>
  );
}

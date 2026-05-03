import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import type { NodeConfigProps } from './types';

export function ClassifyNodeConfig({ nodeData, update }: NodeConfigProps) {
  const classifications = Array.isArray(nodeData.classifications)
    ? (nodeData.classifications as Array<{ label: string; description: string }>)
    : [];

  return (
    <>
      <TextField variant="standard" label="Name" size="small" fullWidth value={(nodeData.label as string) || ''} onChange={e => update('label', e.target.value)} sx={{ mb: 1.5 }} />
      <TextField variant="standard" label="Instructions" size="small" fullWidth multiline minRows={2} maxRows={5} value={(nodeData.instructions as string) || ''} onChange={e => update('instructions', e.target.value)} sx={{ mb: 1.5 }} helperText="Optional. By default, auto-generates from classifications." />
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Classifications</Typography>
      {classifications.map((c, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 0.5, mb: 1, alignItems: 'center' }}>
          <TextField variant="standard" size="small" label="Label" value={c.label} onChange={e => { const updated = [...classifications]; updated[i] = { ...updated[i], label: e.target.value }; update('classifications', updated); }} sx={{ flex: 1 }} />
          <TextField variant="standard" size="small" label="Description" value={c.description} onChange={e => { const updated = [...classifications]; updated[i] = { ...updated[i], description: e.target.value }; update('classifications', updated); }} sx={{ flex: 2 }} />
          <Button size="small" color="error" onClick={() => update('classifications', classifications.filter((_, j) => j !== i))} sx={{ minWidth: 28, px: 0.5, height: 40 }}>X</Button>
        </Box>
      ))}
      <Button size="small" variant="outlined" onClick={() => update('classifications', [...classifications, { label: '', description: '' }])} sx={{ textTransform: 'none', fontSize: '0.8rem' }}>+ Add classification</Button>
    </>
  );
}

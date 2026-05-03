import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import type { NodeConfigProps } from './types';

export function GuardrailNodeConfig({ nodeData, update }: NodeConfigProps) {
  return (
    <>
      <FormControl variant="standard" size="small" fullWidth sx={{ mb: 1.5 }}>
        <InputLabel>Guard Type</InputLabel>
        <Select value={(nodeData.guardType as string) || 'input'} label="Guard Type" onChange={e => update('guardType', e.target.value)}>
          <MenuItem value="input">Input</MenuItem>
          <MenuItem value="output">Output</MenuItem>
        </Select>
      </FormControl>
      <FormControl variant="standard" size="small" fullWidth sx={{ mb: 1.5 }}>
        <InputLabel>On Failure</InputLabel>
        <Select value={(nodeData.onFailure as string) || 'block'} label="On Failure" onChange={e => update('onFailure', e.target.value)}>
          <MenuItem value="block">Block</MenuItem>
          <MenuItem value="warn">Warn</MenuItem>
          <MenuItem value="fallback">Fallback</MenuItem>
        </Select>
      </FormControl>
      {nodeData.onFailure === 'fallback' && (
        <TextField variant="standard" label="Fallback Message" size="small" fullWidth multiline minRows={2} value={(nodeData.fallbackMessage as string) || ''} onChange={e => update('fallbackMessage', e.target.value)} sx={{ mb: 1.5 }} />
      )}
    </>
  );
}

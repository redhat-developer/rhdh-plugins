import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import type { NodeConfigProps } from './types';

export function LogicNodeConfig({ nodeData, update }: NodeConfigProps) {
  return (
    <>
      <FormControl variant="standard" size="small" fullWidth sx={{ mb: 1.5 }}>
        <InputLabel>Logic Type</InputLabel>
        <Select value={(nodeData.kind as string) || 'if_else'} label="Logic Type" onChange={e => update('kind', e.target.value)}>
          <MenuItem value="if_else">If/Else</MenuItem>
          <MenuItem value="while_loop">While Loop</MenuItem>
          <MenuItem value="switch">Switch</MenuItem>
        </Select>
      </FormControl>
      <TextField variant="standard" label="Condition (CEL expression)" size="small" fullWidth multiline minRows={2} value={(nodeData.condition as string) || ''} onChange={e => update('condition', e.target.value)} sx={{ mb: 1.5 }} helperText="Common Expression Language (CEL). Reference previous outputs like: triageResult.output_parsed.classification == 'billing'" placeholder='result.output_parsed.classification == "billing"' />
      {nodeData.kind === 'while_loop' && (
        <TextField variant="standard" label="Max Iterations" size="small" type="number" fullWidth value={(nodeData.maxIterations as number) ?? 5} onChange={e => update('maxIterations', parseInt(e.target.value, 10))} sx={{ mb: 1.5 }} />
      )}
    </>
  );
}

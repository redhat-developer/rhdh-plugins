import { useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import DeleteIcon from '@mui/icons-material/Delete';
import type { NodeConfigProps } from './types';

interface Variable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
}

function VariableRow({ variable, index, onChange, onRemove }: {
  variable: Variable;
  index: number;
  onChange: (index: number, field: keyof Variable, value: string) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'success.main', flexShrink: 0 }} />
      <TextField
        variant="standard"
        size="small"
        value={variable.name}
        onChange={e => onChange(index, 'name', e.target.value)}
        placeholder="variable_name"
        sx={{ flex: 1 }}
      />
      <FormControl variant="standard" size="small" sx={{ minWidth: 80 }}>
        <Select
          value={variable.type}
          onChange={e => onChange(index, 'type', e.target.value)}
          sx={{ fontSize: '0.8rem' }}
        >
          <MenuItem value="string">string</MenuItem>
          <MenuItem value="number">number</MenuItem>
          <MenuItem value="boolean">boolean</MenuItem>
          <MenuItem value="object">object</MenuItem>
        </Select>
      </FormControl>
      <IconButton size="small" onClick={() => onRemove(index)} sx={{ p: 0.25 }}>
        <DeleteIcon sx={{ fontSize: 14 }} />
      </IconButton>
    </Box>
  );
}

export function StartNodeConfig({ nodeData, update }: NodeConfigProps) {
  const inputVars: Variable[] = Array.isArray(nodeData.inputVariables)
    ? (nodeData.inputVariables as Variable[])
    : [{ name: 'input_as_text', type: 'string' }];

  const stateVars: Variable[] = Array.isArray(nodeData.stateVariables)
    ? (nodeData.stateVariables as Variable[])
    : [];

  const handleInputChange = useCallback((index: number, field: keyof Variable, value: string) => {
    const updated = [...inputVars];
    updated[index] = { ...updated[index], [field]: value };
    update('inputVariables', updated);
  }, [inputVars, update]);

  const handleInputRemove = useCallback((index: number) => {
    update('inputVariables', inputVars.filter((_, i) => i !== index));
  }, [inputVars, update]);

  const handleStateChange = useCallback((index: number, field: keyof Variable, value: string) => {
    const updated = [...stateVars];
    updated[index] = { ...updated[index], [field]: value };
    update('stateVariables', updated);
  }, [stateVars, update]);

  const handleStateRemove = useCallback((index: number) => {
    update('stateVariables', stateVars.filter((_, i) => i !== index));
  }, [stateVars, update]);

  return (
    <>
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
        Input variables
      </Typography>
      {inputVars.map((v, i) => (
        <VariableRow key={i} variable={v} index={i} onChange={handleInputChange} onRemove={handleInputRemove} />
      ))}
      <Button
        size="small"
        onClick={() => update('inputVariables', [...inputVars, { name: '', type: 'string' }])}
        sx={{ textTransform: 'none', fontSize: '0.8rem', mb: 3 }}
      >
        + Add
      </Button>

      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
        State variables
      </Typography>
      {stateVars.map((v, i) => (
        <VariableRow key={i} variable={v} index={i} onChange={handleStateChange} onRemove={handleStateRemove} />
      ))}
      <Button
        size="small"
        onClick={() => update('stateVariables', [...stateVars, { name: '', type: 'string' }])}
        sx={{ textTransform: 'none', fontSize: '0.8rem' }}
      >
        + Add
      </Button>
    </>
  );
}

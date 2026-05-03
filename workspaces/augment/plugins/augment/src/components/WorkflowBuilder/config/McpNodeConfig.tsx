import { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import type { NodeConfigProps } from './types';

export function McpNodeConfig({ nodeData, update }: NodeConfigProps) {
  const allowedTools = Array.isArray(nodeData.allowedTools) ? (nodeData.allowedTools as string[]) : [];
  const [toolInput, setToolInput] = useState('');

  const addTool = () => {
    const trimmed = toolInput.trim();
    if (trimmed && !allowedTools.includes(trimmed)) update('allowedTools', [...allowedTools, trimmed]);
    setToolInput('');
  };

  return (
    <>
      <TextField variant="standard" label="Server Label" size="small" fullWidth value={(nodeData.serverLabel as string) || ''} onChange={e => { update('serverLabel', e.target.value); update('label', e.target.value || 'MCP Server'); }} sx={{ mb: 1.5 }} />
      <TextField variant="standard" label="Server URL" size="small" fullWidth value={(nodeData.serverUrl as string) || ''} onChange={e => update('serverUrl', e.target.value)} sx={{ mb: 1.5 }} helperText="SSE or stdio MCP server endpoint" placeholder="https://mcp-server.example.com/sse" />
      <FormControl variant="standard" size="small" fullWidth sx={{ mb: 1.5 }}>
        <InputLabel>Require Approval</InputLabel>
        <Select value={(nodeData.requireApproval as string) || 'never'} label="Require Approval" onChange={e => update('requireApproval', e.target.value)}>
          <MenuItem value="never">Never</MenuItem>
          <MenuItem value="always">Always</MenuItem>
          <MenuItem value="auto">Auto (sensitive tools only)</MenuItem>
        </Select>
      </FormControl>
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Allowed Tools (leave empty for all)</Typography>
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
        {allowedTools.map(t => <Chip key={t} label={t} size="small" onDelete={() => update('allowedTools', allowedTools.filter(x => x !== t))} />)}
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mb: 1.5 }}>
        <TextField variant="standard" label="Add tool name" size="small" fullWidth value={toolInput} onChange={e => setToolInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTool(); } }} />
        <Button variant="outlined" size="small" onClick={addTool} sx={{ minWidth: 32, px: 0.5, height: 40 }}>+</Button>
      </Box>
    </>
  );
}

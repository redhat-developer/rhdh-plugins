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
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import type { NodeConfigProps } from './types';

const V = 'standard' as const;

export function AgentNodeConfig({ nodeData, update, availableModels }: NodeConfigProps) {
  const [mcpInput, setMcpInput] = useState('');
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const mcpServers = Array.isArray(nodeData.mcpServers) ? (nodeData.mcpServers as string[]) : [];

  const agentKey = (nodeData.agentKey as string) || '';
  const instructions = (nodeData.instructions as string) || '';

  const handleAddMcpServer = () => {
    const trimmed = mcpInput.trim();
    if (trimmed && !mcpServers.includes(trimmed)) update('mcpServers', [...mcpServers, trimmed]);
    setMcpInput('');
  };

  const handleSchemaChange = (value: string) => {
    if (!value) {
      update('outputSchema', undefined);
      setSchemaError(null);
      return;
    }
    try {
      update('outputSchema', JSON.parse(value));
      setSchemaError(null);
    } catch (e) {
      setSchemaError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  };

  const sectionSx = { '&:before': { display: 'none' }, '&.MuiAccordion-root': { mb: 0 }, borderBottom: '1px solid', borderColor: 'divider' };
  const summarySx = { px: 0, minHeight: 36, '& .MuiAccordionSummary-content': { my: 0.75 } };
  const headerSx = { fontSize: '0.8rem', letterSpacing: '0.02em', textTransform: 'uppercase' as const, color: 'text.primary' };
  const detailsSx = { px: 0, pt: 1, pb: 1.5 };
  const f = { mb: 2 };

  const InfoTip = ({ text }: { text: string }) => (
    <Tooltip title={text} placement="top" arrow>
      <IconButton size="small" sx={{ p: 0, ml: 0.5, verticalAlign: 'middle' }}>
        <InfoOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
      </IconButton>
    </Tooltip>
  );

  return (
    <>
      <Accordion defaultExpanded disableGutters elevation={0} sx={sectionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />} sx={summarySx}>
          <Typography variant="subtitle2" fontWeight={600} sx={headerSx}>Identity</Typography>
        </AccordionSummary>
        <AccordionDetails sx={detailsSx}>
          <TextField
            variant={V} label="Agent Key" fullWidth
            value={agentKey}
            onChange={e => update('agentKey', e.target.value)}
            error={!agentKey}
            helperText={!agentKey ? 'Required — unique identifier for this agent' : 'Unique identifier'}
            placeholder="support-agent"
            sx={f}
          />
          <TextField variant={V} label="Name" fullWidth value={(nodeData.name as string) || ''} placeholder="Support Agent" onChange={e => { update('name', e.target.value); update('label', e.target.value); }} />
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded disableGutters elevation={0} sx={sectionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />} sx={summarySx}>
          <Typography variant="subtitle2" fontWeight={600} sx={headerSx}>Instructions</Typography>
        </AccordionSummary>
        <AccordionDetails sx={detailsSx}>
          <TextField
            variant={V} label="Instructions" fullWidth multiline minRows={3} maxRows={8}
            value={instructions}
            onChange={e => update('instructions', e.target.value)}
            error={!instructions}
            helperText={!instructions ? 'Required — tell the agent how to behave' : 'System behavior prompt'}
            placeholder="You are a helpful assistant that..."
            sx={f}
          />
          <TextField
            variant={V} label="Handoff Description" fullWidth
            value={(nodeData.handoffDescription as string) || ''}
            onChange={e => update('handoffDescription', e.target.value)}
            helperText="Describes when to hand off to this agent"
            placeholder="Hand off billing questions to this agent"
          />
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded disableGutters elevation={0} sx={sectionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />} sx={summarySx}>
          <Typography variant="subtitle2" fontWeight={600} sx={headerSx}>Model</Typography>
        </AccordionSummary>
        <AccordionDetails sx={detailsSx}>
          {availableModels.length > 0 ? (
            <FormControl variant={V} fullWidth sx={f}>
              <InputLabel>Model</InputLabel>
              <Select value={(nodeData.model as string) || ''} label="Model" onChange={e => update('model', e.target.value)}>
                <MenuItem value=""><em>Default</em></MenuItem>
                {availableModels.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </Select>
            </FormControl>
          ) : (
            <TextField variant={V} label="Model" fullWidth value={(nodeData.model as string) || ''} onChange={e => update('model', e.target.value)} sx={f} helperText="Leave empty to use default model" />
          )}
          <TextField variant={V} label="Temperature" type="number" fullWidth value={(nodeData.temperature as number) ?? ''} onChange={e => update('temperature', e.target.value ? parseFloat(e.target.value) : undefined)} sx={f} inputProps={{ min: 0, max: 2, step: 0.1 }} helperText="0 = deterministic, 2 = creative" />
          <TextField variant={V} label="Max Tokens" type="number" fullWidth value={(nodeData.maxOutputTokens as number) ?? ''} onChange={e => update('maxOutputTokens', e.target.value ? parseInt(e.target.value, 10) : undefined)} helperText="Maximum output length" />
        </AccordionDetails>
      </Accordion>

      <Accordion disableGutters elevation={0} sx={sectionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />} sx={summarySx}>
          <Typography variant="subtitle2" fontWeight={600} sx={headerSx}>
            Behavior
            <InfoTip text="Control how the agent processes requests and generates responses" />
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={detailsSx}>
          <FormControlLabel control={<Switch size="small" checked={Boolean(nodeData.chatHistory !== false)} onChange={e => update('chatHistory', e.target.checked)} />} label={<Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Chat history</Typography>} sx={{ mb: 1.5, ml: -0.5 }} />
          <FormControl variant={V} fullWidth sx={f}>
            <InputLabel>Reasoning Effort</InputLabel>
            <Select value={(nodeData.reasoningEffort as string) || 'default'} label="Reasoning Effort" onChange={e => update('reasoningEffort', e.target.value === 'default' ? undefined : e.target.value)}>
              <MenuItem value="default">Default</MenuItem>
              <MenuItem value="minimal">Minimal</MenuItem>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </Select>
          </FormControl>
          <FormControl variant={V} fullWidth>
            <InputLabel>Output Format</InputLabel>
            <Select value={(nodeData.outputFormat as string) || 'text'} label="Output Format" onChange={e => update('outputFormat', e.target.value)}>
              <MenuItem value="text">Text</MenuItem>
              <MenuItem value="json_object">JSON Object</MenuItem>
              <MenuItem value="json_schema">JSON Schema</MenuItem>
            </Select>
          </FormControl>
        </AccordionDetails>
      </Accordion>

      <Accordion disableGutters elevation={0} sx={sectionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />} sx={summarySx}>
          <Typography variant="subtitle2" fontWeight={600} sx={headerSx}>
            Structured Output
            <InfoTip text="Define a JSON schema for typed agent output. Uses Zod-compatible format." />
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={detailsSx}>
          <TextField
            variant={V} label="Schema (JSON)" fullWidth multiline minRows={3} maxRows={8}
            value={nodeData.outputSchema ? JSON.stringify(nodeData.outputSchema, null, 2) : ''}
            onChange={e => handleSchemaChange(e.target.value)}
            error={!!schemaError}
            helperText={schemaError || 'Zod-compatible typed output'}
            placeholder={'{"classification": "z.enum([\\"billing\\", \\"support\\"])"}'}
          />
        </AccordionDetails>
      </Accordion>

      <Accordion disableGutters elevation={0} sx={sectionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />} sx={summarySx}>
          <Typography variant="subtitle2" fontWeight={600} sx={headerSx}>Tools</Typography>
        </AccordionSummary>
        <AccordionDetails sx={detailsSx}>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: mcpServers.length ? 1.5 : 0 }}>
            {mcpServers.map(s => <Chip key={s} label={s} size="small" onDelete={() => update('mcpServers', mcpServers.filter(x => x !== s))} />)}
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-end', mb: 2 }}>
            <TextField variant={V} label="MCP Server URL" fullWidth value={mcpInput} onChange={e => setMcpInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddMcpServer(); } }} placeholder="https://mcp-server.example.com/sse" helperText="SSE or stdio endpoint URL" />
            <Button variant="text" size="small" onClick={handleAddMcpServer} sx={{ minWidth: 32, px: 0.5 }}>+</Button>
          </Box>
          <FormControl variant={V} fullWidth>
            <InputLabel>Tool Behavior</InputLabel>
            <Select value={(nodeData.toolUseBehavior as string) || 'run_llm_again'} label="Tool Behavior" onChange={e => update('toolUseBehavior', e.target.value)}>
              <MenuItem value="run_llm_again">Run LLM Again</MenuItem>
              <MenuItem value="stop_on_first_tool">Stop on First</MenuItem>
            </Select>
          </FormControl>
        </AccordionDetails>
      </Accordion>
    </>
  );
}

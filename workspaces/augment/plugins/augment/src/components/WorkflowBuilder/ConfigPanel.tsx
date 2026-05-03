import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { SPACING } from './theme/tokens';
import {
  AgentNodeConfig,
  ClassifyNodeConfig,
  LogicNodeConfig,
  ToolNodeConfig,
  GuardrailNodeConfig,
  FileSearchNodeConfig,
  McpNodeConfig,
  StartNodeConfig,
} from './config';

const TYPE_LABELS: Record<string, string> = {
  agent: 'Agent',
  classify: 'Classify',
  logic: 'Condition',
  tool: 'Tool',
  guardrail: 'Guardrail',
  file_search: 'File search',
  mcp: 'MCP',
  start: 'Start',
  end: 'End',
  note: 'Note',
  transform: 'Transform',
  set_state: 'Set state',
  user_interaction: 'User approval',
};

const TYPE_SUBTITLES: Record<string, string> = {
  agent: 'Call the model with your instructions and tools',
  classify: 'Route input to different agents based on classification',
  logic: 'Branch the workflow based on a condition',
  tool: 'Execute a tool function',
  guardrail: 'Validate input or output with a guardrail',
  file_search: 'Search files in a vector store',
  mcp: 'Connect to an MCP server',
  start: 'Define the workflow inputs',
};

interface ConfigPanelProps {
  nodeId: string;
  nodeType: string;
  nodeData: Record<string, unknown>;
  onChange: (nodeId: string, field: string, value: unknown) => void;
  onClose: () => void;
  onDelete?: (nodeId: string) => void;
  availableModels?: string[];
}

export function ConfigPanel({
  nodeId,
  nodeType,
  nodeData,
  onChange,
  onClose,
  onDelete,
  availableModels = [],
}: ConfigPanelProps) {
  const update = (field: string, value: unknown) => onChange(nodeId, field, value);

  const renderConfig = () => {
    const props = { nodeData, update, availableModels };
    switch (nodeType) {
      case 'start': return <StartNodeConfig {...props} />;
      case 'agent': return <AgentNodeConfig {...props} />;
      case 'classify': return <ClassifyNodeConfig {...props} />;
      case 'logic': return <LogicNodeConfig {...props} />;
      case 'tool': return <ToolNodeConfig {...props} />;
      case 'guardrail': return <GuardrailNodeConfig {...props} />;
      case 'file_search': return <FileSearchNodeConfig {...props} />;
      case 'mcp': return <McpNodeConfig {...props} />;
      case 'note':
        return <TextField variant="standard" label="Text" fullWidth multiline minRows={3} value={(nodeData.text as string) || ''} onChange={e => update('text', e.target.value)} />;
      case 'transform':
        return <TextField variant="standard" label="Expression" fullWidth multiline minRows={2} value={(nodeData.expression as string) || ''} onChange={e => update('expression', e.target.value)} helperText="JavaScript expression" />;
      default:
        return <Typography variant="body2" color="text.secondary">No configuration available.</Typography>;
    }
  };

  return (
    <Box
      sx={{
        width: SPACING.panelWidth,
        flexShrink: 0,
        borderLeft: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        transition: 'width 0.2s ease',
      }}
    >
      <Box sx={{ px: 2, pt: 1.5, pb: 1, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ color: 'text.primary' }}>
              {TYPE_LABELS[nodeType] || nodeType}
            </Typography>
            {TYPE_SUBTITLES[nodeType] && (
              <Typography variant="caption" sx={{ display: 'block', mt: 0.25, lineHeight: 1.3, color: 'text.secondary' }}>
                {TYPE_SUBTITLES[nodeType]}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 0.25, ml: 1 }}>
            {onDelete && nodeType !== 'start' && (
              <Tooltip title="Delete node">
                <IconButton size="small" onClick={() => onDelete(nodeId)} color="error" aria-label="Delete node" sx={{ p: 0.5 }}>
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Close panel">
              <IconButton size="small" onClick={onClose} aria-label="Close configuration" sx={{ p: 0.5 }}>
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          px: 2,
          py: 2,
          scrollbarWidth: 'thin',
        }}
      >
        {renderConfig()}
      </Box>
    </Box>
  );
}

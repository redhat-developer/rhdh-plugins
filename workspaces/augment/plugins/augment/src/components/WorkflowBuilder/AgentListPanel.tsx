import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CategoryIcon from '@mui/icons-material/Category';
import StopIcon from '@mui/icons-material/Stop';
import StickyNote2Icon from '@mui/icons-material/StickyNote2';
import SearchIcon from '@mui/icons-material/Search';
import ShieldIcon from '@mui/icons-material/Shield';
import HubIcon from '@mui/icons-material/Hub';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import LoopIcon from '@mui/icons-material/Loop';
import PersonIcon from '@mui/icons-material/Person';
import TransformIcon from '@mui/icons-material/Transform';
import DataObjectIcon from '@mui/icons-material/DataObject';
import type { ReactNode } from 'react';
import { nodeColor, SPACING, TYPE_SCALE } from './theme/tokens';

interface PaletteItem {
  type: string;
  label: string;
  icon: ReactNode;
  tooltip: string;
}

const CATEGORIES: { title: string; items: PaletteItem[] }[] = [
  {
    title: 'Core',
    items: [
      { type: 'agent', label: 'Agent', icon: <SmartToyIcon />, tooltip: 'Call an LLM with instructions and tools' },
      { type: 'classify', label: 'Classify', icon: <CategoryIcon />, tooltip: 'Route input based on classification' },
      { type: 'end', label: 'End', icon: <StopIcon />, tooltip: 'End the workflow' },
      { type: 'note', label: 'Note', icon: <StickyNote2Icon />, tooltip: 'Add a comment (not executed)' },
    ],
  },
  {
    title: 'Tools',
    items: [
      { type: 'file_search', label: 'File search', icon: <SearchIcon />, tooltip: 'Search files in a vector store' },
      { type: 'guardrail', label: 'Guardrails', icon: <ShieldIcon />, tooltip: 'Validate input or output' },
      { type: 'mcp', label: 'MCP', icon: <HubIcon />, tooltip: 'Connect to an MCP server' },
    ],
  },
  {
    title: 'Logic',
    items: [
      { type: 'logic', label: 'If / else', icon: <AccountTreeIcon />, tooltip: 'Branch on a condition' },
      { type: 'while', label: 'While', icon: <LoopIcon />, tooltip: 'Loop while condition is true' },
      { type: 'user_interaction', label: 'User approval', icon: <PersonIcon />, tooltip: 'Pause for user approval' },
    ],
  },
  {
    title: 'Data',
    items: [
      { type: 'transform', label: 'Transform', icon: <TransformIcon />, tooltip: 'Transform data with an expression' },
      { type: 'set_state', label: 'Set state', icon: <DataObjectIcon />, tooltip: 'Set a workflow state variable' },
    ],
  },
];

interface AgentListPanelProps {
  onAddNode: (type: string) => void;
}

export function AgentListPanel({ onAddNode }: AgentListPanelProps) {
  const theme = useTheme();
  const mode = theme.palette.mode;

  return (
    <Box
      sx={{
        width: SPACING.paletteWidth,
        flexShrink: 0,
        borderRight: '1px solid',
        borderColor: 'divider',
        overflowY: 'auto',
        overflowX: 'hidden',
        py: 1.5,
        px: 1,
        bgcolor: 'background.paper',
        scrollbarWidth: 'thin',
      }}
    >
      {CATEGORIES.map(cat => (
        <Box key={cat.title} sx={{ mb: 2 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'text.disabled',
              fontSize: TYPE_SCALE.microLabel.size,
              fontWeight: TYPE_SCALE.microLabel.weight,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              px: 0.5,
              mb: 0.5,
              display: 'block',
            }}
          >
            {cat.title}
          </Typography>
          {cat.items.map(item => (
            <Tooltip key={item.type} title={item.tooltip} placement="right" arrow enterDelay={400}>
              <Box
                role="button"
                tabIndex={0}
                aria-label={`Add ${item.label} node`}
                onClick={() => onAddNode(item.type)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAddNode(item.type); } }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 0.75,
                  py: 0.6,
                  borderRadius: 1,
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'background-color 0.1s',
                  '&:hover': { bgcolor: 'action.hover' },
                  '&:active': { bgcolor: 'action.selected' },
                  '&:focus-visible': {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: -1,
                  },
                }}
              >
                <Box sx={{ color: nodeColor(item.type, mode), display: 'flex', '& svg': { fontSize: 16 } }}>
                  {item.icon}
                </Box>
                <Typography variant="body2" sx={{ fontSize: '0.78rem', color: 'text.primary' }}>
                  {item.label}
                </Typography>
              </Box>
            </Tooltip>
          ))}
        </Box>
      ))}
    </Box>
  );
}

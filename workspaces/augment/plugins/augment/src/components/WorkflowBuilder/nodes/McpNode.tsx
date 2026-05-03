import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import HubIcon from '@mui/icons-material/Hub';
import { BaseNode } from './BaseNode';

export const McpNode = memo(function McpNode({ data, selected }: NodeProps) {
  const d = data as Record<string, unknown>;
  const label = (d.label as string) || 'MCP';

  return (
    <BaseNode
      title={label}
      icon={<HubIcon sx={{ fontSize: 14, color: '#fff' }} />}
      nodeType="mcp"
      selected={selected}
    />
  );
});

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import BuildIcon from '@mui/icons-material/Build';
import { BaseNode } from './BaseNode';

export const ToolNode = memo(function ToolNode({ data, selected }: NodeProps) {
  const d = data as Record<string, unknown>;
  const label = (d.label as string) || (d.toolName as string) || 'Tool';

  return (
    <BaseNode
      title={label}
      icon={<BuildIcon sx={{ fontSize: 14, color: '#fff' }} />}
      nodeType="tool"
      selected={selected}
    />
  );
});

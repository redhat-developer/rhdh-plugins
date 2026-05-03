import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import TransformIcon from '@mui/icons-material/Transform';
import { BaseNode } from './BaseNode';

export const TransformNode = memo(function TransformNode({ data, selected }: NodeProps) {
  const d = data as Record<string, unknown>;
  const label = (d.label as string) || 'Transform';

  return (
    <BaseNode
      title={label}
      icon={<TransformIcon sx={{ fontSize: 14, color: '#fff' }} />}
      nodeType="transform"
      selected={selected}
    />
  );
});

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import CategoryIcon from '@mui/icons-material/Category';
import { BaseNode } from './BaseNode';

export const ClassifyNode = memo(function ClassifyNode({ data, selected }: NodeProps) {
  const d = data as Record<string, unknown>;
  const label = (d.label as string) || 'Classify';

  return (
    <BaseNode
      title={label}
      description="Route based on classification"
      icon={<CategoryIcon sx={{ fontSize: 14, color: '#fff' }} />}
      nodeType="classify"
      selected={selected}
    />
  );
});

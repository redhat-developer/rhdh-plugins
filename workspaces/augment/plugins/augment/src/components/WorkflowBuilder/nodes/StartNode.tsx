import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { BaseNode } from './BaseNode';

export const StartNode = memo(function StartNode({ selected }: NodeProps) {
  return (
    <BaseNode
      title="Start"
      icon={<PlayArrowIcon sx={{ fontSize: 14, color: '#fff' }} />}
      nodeType="start"
      selected={selected}
      hasTarget={false}
    />
  );
});

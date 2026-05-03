import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import StopIcon from '@mui/icons-material/Stop';
import { BaseNode } from './BaseNode';

export const EndNode = memo(function EndNode({ selected }: NodeProps) {
  return (
    <BaseNode
      title="End"
      icon={<StopIcon sx={{ fontSize: 14, color: '#fff' }} />}
      nodeType="end"
      selected={selected}
      hasSource={false}
    />
  );
});

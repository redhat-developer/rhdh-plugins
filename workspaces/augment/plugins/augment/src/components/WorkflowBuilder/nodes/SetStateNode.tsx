import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import DataObjectIcon from '@mui/icons-material/DataObject';
import { BaseNode } from './BaseNode';

export const SetStateNode = memo(function SetStateNode({ data, selected }: NodeProps) {
  const d = data as Record<string, unknown>;
  const label = (d.label as string) || 'Set state';

  return (
    <BaseNode
      title={label}
      icon={<DataObjectIcon sx={{ fontSize: 14, color: '#fff' }} />}
      nodeType="set_state"
      selected={selected}
    />
  );
});

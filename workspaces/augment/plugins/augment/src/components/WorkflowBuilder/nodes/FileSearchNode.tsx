import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import SearchIcon from '@mui/icons-material/Search';
import { BaseNode } from './BaseNode';

export const FileSearchNode = memo(function FileSearchNode({ data, selected }: NodeProps) {
  const d = data as Record<string, unknown>;
  const label = (d.label as string) || 'File search';

  return (
    <BaseNode
      title={label}
      icon={<SearchIcon sx={{ fontSize: 14, color: '#fff' }} />}
      nodeType="file_search"
      selected={selected}
    />
  );
});

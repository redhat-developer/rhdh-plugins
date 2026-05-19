/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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

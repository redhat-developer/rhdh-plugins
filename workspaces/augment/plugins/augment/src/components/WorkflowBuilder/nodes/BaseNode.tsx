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
import type { ReactNode } from 'react';
import { Handle, Position } from '@xyflow/react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import {
  nodeColor,
  selectionRing,
  elevationShadow,
  TYPE_SCALE,
  TRANSITIONS,
} from '../theme/tokens';

interface BaseNodeProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: ReactNode;
  nodeType: string;
  selected?: boolean;
  hasSource?: boolean;
  hasTarget?: boolean;
}

export function BaseNode({
  title,
  subtitle,
  description,
  icon,
  nodeType,
  selected = false,
  hasSource = true,
  hasTarget = true,
}: BaseNodeProps) {
  const theme = useTheme();
  const bg = nodeColor(nodeType, theme.palette.mode);

  return (
    <Box
      className="wf-node"
      sx={{
        px: 2,
        py: 1.5,
        borderRadius: 2,
        bgcolor: bg,
        color: '#fff',
        minWidth: 140,
        maxWidth: 220,
        cursor: 'pointer',
        outline: selected ? selectionRing(theme) : 'none',
        outlineOffset: 2,
        transition: `outline ${TRANSITIONS.normal}, transform ${TRANSITIONS.normal}, box-shadow ${TRANSITIONS.normal}`,
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: elevationShadow(theme, 2),
        },
      }}
    >
      {hasTarget && (
        <Handle
          type="target"
          position={Position.Left}
          style={{ opacity: 0, width: 10, height: 10 }}
        />
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        {icon}
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="body2"
            fontWeight={TYPE_SCALE.nodeTitle.weight}
            noWrap
            sx={{ fontSize: TYPE_SCALE.nodeTitle.size, color: '#fff' }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              noWrap
              sx={{
                color: '#fff',
                opacity: 0.7,
                fontSize: TYPE_SCALE.nodeSubtitle.size,
                display: 'block',
                lineHeight: 1.2,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      {description && (
        <Typography
          variant="caption"
          sx={{
            color: '#fff',
            opacity: 0.85,
            fontSize: TYPE_SCALE.nodeDesc.size,
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mt: 0.25,
          }}
        >
          {description}
        </Typography>
      )}
      {hasSource && (
        <Handle
          type="source"
          position={Position.Right}
          style={{ opacity: 0, width: 10, height: 10 }}
        />
      )}
    </Box>
  );
}

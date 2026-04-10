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

import { useState, type FC, type ReactNode, memo } from 'react';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

interface JsonTreeViewerProps {
  data: unknown;
  depth?: number;
}

const MAX_DEPTH = 12;
const INDENT = 14;

const JsonValue: FC<{ value: unknown; depth: number }> = memo(
  function JsonValue({ value, depth }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    if (value === null) {
      return (
        <Box component="span" sx={{ color: isDark ? '#ce9178' : '#a31515' }}>
          null
        </Box>
      );
    }

    if (value === undefined) {
      return (
        <Box
          component="span"
          sx={{ color: 'text.disabled', fontStyle: 'italic' }}
        >
          undefined
        </Box>
      );
    }

    if (typeof value === 'boolean') {
      return (
        <Box component="span" sx={{ color: isDark ? '#569cd6' : '#0000ff' }}>
          {value.toString()}
        </Box>
      );
    }

    if (typeof value === 'number') {
      return (
        <Box component="span" sx={{ color: isDark ? '#b5cea8' : '#098658' }}>
          {value}
        </Box>
      );
    }

    if (typeof value === 'string') {
      const truncated = value.length > 200 ? `${value.slice(0, 200)}…` : value;
      return (
        <Box
          component="span"
          sx={{
            color: isDark ? '#ce9178' : '#a31515',
            wordBreak: 'break-word',
          }}
          title={value.length > 200 ? value : undefined}
        >
          &quot;{truncated}&quot;
        </Box>
      );
    }

    if (Array.isArray(value)) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return <JsonNode data={value} depth={depth} />;
    }

    if (typeof value === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return <JsonNode data={value} depth={depth} />;
    }

    return (
      <Box component="span" sx={{ color: 'text.secondary' }}>
        {String(value)}
      </Box>
    );
  },
);

const JsonNode: FC<{ data: unknown; depth: number }> = memo(function JsonNode({
  data,
  depth,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [expanded, setExpanded] = useState(depth < 2);

  if (depth >= MAX_DEPTH) {
    return (
      <Box
        component="span"
        sx={{ color: 'text.disabled', fontStyle: 'italic' }}
      >
        [max depth]
      </Box>
    );
  }

  const isArray = Array.isArray(data);
  const entries = isArray
    ? (data as unknown[]).map((v, i) => [String(i), v] as const)
    : Object.entries(data as Record<string, unknown>);

  if (entries.length === 0) {
    return (
      <Box component="span" sx={{ color: 'text.disabled' }}>
        {isArray ? '[]' : '{}'}
      </Box>
    );
  }

  const bracketColor = isDark ? '#d4d4d4' : '#333';
  const toggle = (
    <Box
      component="span"
      role="button"
      tabIndex={0}
      onClick={e => {
        e.stopPropagation();
        setExpanded(prev => !prev);
      }}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          setExpanded(prev => !prev);
        }
      }}
      sx={{
        cursor: 'pointer',
        userSelect: 'none',
        color: bracketColor,
        '&:hover': { opacity: 0.7 },
      }}
    >
      {expanded ? '▾' : '▸'}{' '}
      <Box component="span" sx={{ color: bracketColor }}>
        {isArray ? '[' : '{'}
      </Box>
      {!expanded && (
        <Box
          component="span"
          sx={{ color: 'text.disabled', fontSize: '0.6rem' }}
        >
          {' '}
          {entries.length} {entries.length === 1 ? 'item' : 'items'}{' '}
        </Box>
      )}
      {!expanded && (
        <Box component="span" sx={{ color: bracketColor }}>
          {isArray ? ']' : '}'}
        </Box>
      )}
    </Box>
  );

  if (!expanded) {
    return toggle;
  }

  const rows: ReactNode[] = entries.map(([key, val]) => {
    const isPrimitive =
      val === null || val === undefined || typeof val !== 'object';

    return (
      <Box key={key} sx={{ pl: `${INDENT}px` }}>
        {!isArray && (
          <Box
            component="span"
            sx={{
              color: isDark ? '#9cdcfe' : '#0451a5',
              fontWeight: 500,
              mr: 0.5,
            }}
          >
            {key}
          </Box>
        )}
        {!isArray && (
          <Box component="span" sx={{ color: 'text.disabled', mr: 0.5 }}>
            :
          </Box>
        )}
        {isPrimitive ? (
          <JsonValue value={val} depth={depth + 1} />
        ) : (
          <JsonValue value={val} depth={depth + 1} />
        )}
      </Box>
    );
  });

  return (
    <Box component="span">
      {toggle}
      <Box>{rows}</Box>
      <Box component="span" sx={{ color: bracketColor }}>
        {isArray ? ']' : '}'}
      </Box>
    </Box>
  );
});

export const JsonTreeViewer: FC<JsonTreeViewerProps> = memo(
  function JsonTreeViewer({ data, depth = 0 }) {
    return (
      <Box
        sx={{
          fontFamily: 'monospace',
          fontSize: '0.65rem',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
        }}
      >
        <JsonValue value={data} depth={depth} />
      </Box>
    );
  },
);

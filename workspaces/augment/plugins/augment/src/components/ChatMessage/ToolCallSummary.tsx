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

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import type { ToolCallInfo } from '../../types';
import { stripToolPrefix } from '../../utils';

interface ToolCallSummaryProps {
  toolCalls: ToolCallInfo[];
}

export function ToolCallSummary({ toolCalls }: ToolCallSummaryProps) {
  const theme = useTheme();

  if (!toolCalls || toolCalls.length === 0) return null;

  const counts = new Map<string, { count: number; hasError: boolean }>();
  for (const tc of toolCalls) {
    const name = stripToolPrefix(tc.name, tc.serverLabel);
    const existing = counts.get(name);
    counts.set(name, {
      count: (existing?.count ?? 0) + 1,
      hasError: existing?.hasError || !!tc.error,
    });
  }

  const hasErrors = toolCalls.some(tc => !!tc.error);

  return (
    <Box
      sx={{
        mt: 1.5,
        pt: 1,
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        flexWrap: 'wrap',
      }}
    >
      {hasErrors ? (
        <ErrorOutlineIcon
          sx={{ fontSize: 14, color: theme.palette.warning.main }}
        />
      ) : (
        <CheckCircleIcon
          sx={{ fontSize: 14, color: theme.palette.success.main }}
        />
      )}
      <BuildIcon sx={{ fontSize: 13, color: theme.palette.text.disabled }} />
      <Typography
        variant="caption"
        sx={{
          color: theme.palette.text.secondary,
          fontSize: '0.75rem',
          fontWeight: 500,
        }}
      >
        Used{' '}
        {Array.from(counts.entries())
          .map(([name, { count }]) =>
            count > 1 ? `${name} \u00d7${count}` : name,
          )
          .join(', ')}
      </Typography>
    </Box>
  );
}

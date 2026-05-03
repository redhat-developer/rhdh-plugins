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
import Chip from '@mui/material/Chip';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import { useTheme } from '@mui/material/styles';
import type { NodeExecutionRecord } from '@red-hat-developer-hub/backstage-plugin-augment-common';

interface ExecutionTraceProps {
  records: NodeExecutionRecord[];
  title?: string;
  onNodeClick?: (nodeId: string) => void;
}

const statusIcons: Record<string, typeof CheckCircleIcon> = {
  completed: CheckCircleIcon,
  failed: ErrorIcon,
  running: HourglassEmptyIcon,
  skipped: SkipNextIcon,
};

export function ExecutionTrace({ records, title, onNodeClick }: ExecutionTraceProps) {
  const theme = useTheme();

  const statusColors: Record<string, string> = {
    completed: theme.palette.success.main,
    failed: theme.palette.error.main,
    running: theme.palette.warning.main,
    skipped: theme.palette.grey[500],
  };
  if (records.length === 0) return null;

  const totalTokens = records.reduce(
    (acc, r) => ({
      input: acc.input + (r.tokenUsage?.inputTokens ?? 0),
      output: acc.output + (r.tokenUsage?.outputTokens ?? 0),
    }),
    { input: 0, output: 0 },
  );

  const totalDuration = records.reduce(
    (acc, r) => acc + (r.durationMs ?? 0),
    0,
  );

  return (
    <Box sx={{ p: 1.5 }}>
      {title && (
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
          {title}
        </Typography>
      )}
      <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
        <Chip
          label={`${records.length} nodes`}
          size="small"
          variant="outlined"
        />
        {totalDuration > 0 && (
          <Chip
            label={`${(totalDuration / 1000).toFixed(1)}s`}
            size="small"
            variant="outlined"
          />
        )}
        {(totalTokens.input > 0 || totalTokens.output > 0) && (
          <Chip
            label={`${totalTokens.input + totalTokens.output} tokens`}
            size="small"
            variant="outlined"
          />
        )}
      </Box>

      {records.map((record, idx) => {
        const StatusIcon = statusIcons[record.status] || HourglassEmptyIcon;
        const color = statusColors[record.status] || '#9e9e9e';

        return (
          <Accordion
            key={`${record.nodeId}-${idx}`}
            disableGutters
            elevation={0}
            onChange={() => onNodeClick?.(record.nodeId)}
            sx={{
              '&:before': { display: 'none' },
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              mb: 0.5,
              cursor: onNodeClick ? 'pointer' : undefined,
              '&.Mui-expanded': { mb: 0.5 },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ minHeight: 36, '& .MuiAccordionSummary-content': { my: 0.5 } }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <StatusIcon sx={{ fontSize: 16, color }} />
                <Typography variant="body2" fontWeight={500} sx={{ flex: 1 }}>
                  {record.nodeName}
                </Typography>
                <Chip
                  label={record.nodeType}
                  size="small"
                  sx={{ height: 18, fontSize: '0.65rem' }}
                />
                {record.durationMs != null && (
                  <Typography variant="caption" color="text.secondary">
                    {record.durationMs}ms
                  </Typography>
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0, pb: 1 }}>
              {record.tokenUsage && (
                <Typography variant="caption" color="text.secondary" display="block">
                  Tokens: {record.tokenUsage.inputTokens} in / {record.tokenUsage.outputTokens} out
                </Typography>
              )}
              {record.error && (
                <Typography variant="caption" color="error" display="block">
                  Error: {record.error}
                </Typography>
              )}
              {record.output != null && (
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 0.5,
                    p: 0.5,
                    bgcolor: 'grey.50',
                    borderRadius: 0.5,
                    maxHeight: 80,
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                    fontSize: '0.7rem',
                  }}
                >
                  {typeof record.output === 'string'
                    ? record.output
                    : JSON.stringify(record.output, null, 2)}
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
}

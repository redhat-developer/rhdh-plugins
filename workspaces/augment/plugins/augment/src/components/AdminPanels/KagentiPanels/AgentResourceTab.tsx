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

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import { useTheme, alpha } from '@mui/material/styles';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import type { KagentiAgentDetail } from '@red-hat-developer-hub/backstage-plugin-augment-common';

export interface AgentResourceTabProps {
  agentDetail: KagentiAgentDetail | null;
  loading: boolean;
  copied: boolean;
  onCopy: (text: string) => void;
}

export function AgentResourceTab({
  agentDetail,
  loading,
  copied,
  onCopy,
}: AgentResourceTabProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const yamlContent = useMemo(() => {
    if (!agentDetail) return null;
    const resource: Record<string, unknown> = {};
    if (agentDetail.metadata) resource.metadata = agentDetail.metadata;
    if (agentDetail.spec) resource.spec = agentDetail.spec;
    if (agentDetail.status) resource.status = agentDetail.status;
    try {
      return JSON.stringify(resource, null, 2);
    } catch {
      return null;
    }
  }, [agentDetail]);

  return (
    <Card variant="outlined" sx={{ p: 0, overflow: 'hidden' }}>
      {loading && (
        <Box sx={{ p: 3 }}>
          {Array.from({ length: 15 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="text"
              width={`${60 + Math.random() * 30}%`}
            />
          ))}
        </Box>
      )}
      {!loading && yamlContent && (
        <Box sx={{ position: 'relative' }}>
          <IconButton
            size="small"
            onClick={() => onCopy(yamlContent)}
            title={copied ? 'Copied!' : 'Copy'}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 1,
              bgcolor: 'background.paper',
            }}
          >
            <ContentCopyIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <Box
            component="pre"
            sx={{
              p: 2.5,
              m: 0,
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              lineHeight: 1.6,
              overflow: 'auto',
              maxHeight: 600,
              bgcolor: isDark
                ? alpha(theme.palette.common.black, 0.3)
                : alpha(theme.palette.grey[50], 0.8),
              color: theme.palette.text.primary,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {yamlContent}
          </Box>
        </Box>
      )}
      {!loading && !yamlContent && (
        <Box sx={{ p: 3 }}>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.disabled }}
          >
            No resource data available
          </Typography>
        </Box>
      )}
    </Card>
  );
}

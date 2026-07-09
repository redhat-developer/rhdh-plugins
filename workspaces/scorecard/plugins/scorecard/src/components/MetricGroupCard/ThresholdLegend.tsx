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

import { useCallback } from 'react';

import { Text } from '@backstage/ui';

import Box from '@mui/material/Box';
import { useTheme, alpha } from '@mui/material/styles';

import { resolveStatusColor } from '../../utils';
import type { ThresholdBucket } from './types';

interface ThresholdLegendProps {
  buckets: ThresholdBucket[];
  activeFilters: Set<string>;
  onToggleFilter: (key: string) => void;
}

export function ThresholdLegend({
  buckets,
  activeFilters,
  onToggleFilter,
}: ThresholdLegendProps) {
  const theme = useTheme();

  const handleKeyDown = useCallback(
    (key: string) => (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onToggleFilter(key);
      }
    },
    [onToggleFilter],
  );

  if (buckets.length === 0) return null;

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
        alignItems: 'center',
      }}
    >
      {buckets.map(bucket => {
        const resolvedColor = resolveStatusColor(theme, bucket.color);
        const isActive = activeFilters.has(bucket.key);
        return (
          <Box
            key={bucket.key}
            role="button"
            tabIndex={0}
            aria-pressed={isActive}
            onClick={() => onToggleFilter(bucket.key)}
            onKeyDown={handleKeyDown(bucket.key)}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              border: '1px solid',
              borderColor: isActive ? resolvedColor : 'divider',
              borderRadius: 5,
              px: 1.5,
              py: 0.5,
              flexShrink: 0,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              backgroundColor: isActive
                ? alpha(resolvedColor, 0.08)
                : 'transparent',
              transition: 'all 0.15s ease',
              '&:hover': {
                borderColor: resolvedColor,
                backgroundColor: alpha(resolvedColor, 0.04),
              },
              '&:focus-visible': {
                outline: `2px solid ${resolvedColor}`,
                outlineOffset: 1,
              },
            }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '10%',
                backgroundColor: resolvedColor,
                flexShrink: 0,
              }}
            />
            <Text variant="body-small">
              {bucket.label} ({bucket.count})
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}

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
import Skeleton from '@mui/material/Skeleton';
import { borderRadius } from '../../../theme/tokens';

interface CardGridSkeletonProps {
  cards?: number;
  cardHeight?: number;
}

/**
 * Skeleton placeholder mimicking a grid of cards.
 */
export function CardGridSkeleton({ cards = 4, cardHeight = 120 }: CardGridSkeletonProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 2,
      }}
    >
      {Array.from({ length: cards }).map((_, i) => (
        <Skeleton
          key={i}
          variant="rounded"
          height={cardHeight}
          sx={{ borderRadius: borderRadius.md }}
        />
      ))}
    </Box>
  );
}

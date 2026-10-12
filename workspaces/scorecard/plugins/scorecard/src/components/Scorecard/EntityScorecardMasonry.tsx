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

import { useRef, type ReactNode } from 'react';

import Box from '@mui/material/Box';
import Masonry from '@mui/lab/Masonry';

import { useEntityScorecardColumns } from '../../hooks/useEntityScorecardColumns';

type EntityScorecardMasonryProps = {
  /** Required by MUI Masonry (`NonNullable<ReactNode>`). */
  children: NonNullable<ReactNode>;
};

/**
 * Masonry layout whose column count follows the entity tab content width
 * (via ResizeObserver), so cards densify without vertical gaps and reflow
 * when a docked drawer shrinks the main content area.
 */
export const EntityScorecardMasonry = ({
  children,
}: EntityScorecardMasonryProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const columns = useEntityScorecardColumns(containerRef);

  return (
    <Box
      ref={containerRef}
      sx={{ width: '100%' }}
      data-testid="scorecard-entity-grid"
    >
      <Masonry columns={columns} spacing={2} sequential>
        {children}
      </Masonry>
    </Box>
  );
};

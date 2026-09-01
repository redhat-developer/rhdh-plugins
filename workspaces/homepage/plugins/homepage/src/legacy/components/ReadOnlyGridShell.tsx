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

import type { ComponentType, ReactNode } from 'react';
import { useMemo } from 'react';
import { Layout, Layouts, Responsive } from 'react-grid-layout';

import { ErrorBoundary } from '@backstage/core-components';
import Box from '@mui/material/Box';

import 'react-grid-layout/css/styles.css';

import useMeasure from 'react-use/lib/useMeasure';

import { GRID_GAP, readOnlyGridProps } from '../../utils/gridDefaults';
import { cardWrapperSx } from '../../styles/cardWrapperSx';

export interface GridCard {
  id: string;
  Component: ComponentType<any>;
  props?: Record<string, any>;
  layouts: Record<string, Layout>;
}

interface ReadOnlyGridShellProps {
  cards: GridCard[];
}

export const ReadOnlyGridShell = ({ cards }: ReadOnlyGridShellProps) => {
  const [measureRef, measureRect] = useMeasure<HTMLDivElement>();

  const layouts = useMemo<Layouts>(() => {
    const result: Layouts = {};
    for (const card of cards) {
      for (const [breakpoint, layout] of Object.entries(card.layouts)) {
        if (!result[breakpoint]) {
          result[breakpoint] = [];
        }
        result[breakpoint].push(layout);
      }
    }
    return result;
  }, [cards]);

  const children = useMemo<ReactNode[]>(() => {
    return cards.map(card => (
      <Box
        key={card.id}
        data-cardid={card.id}
        data-testid={`home-page card ${card.id}`}
        data-layout={JSON.stringify(card.layouts)}
        sx={cardWrapperSx}
      >
        <ErrorBoundary>
          <card.Component {...card.props} />
        </ErrorBoundary>
      </Box>
    ));
  }, [cards]);

  return (
    <div style={{ margin: -GRID_GAP }}>
      <div ref={measureRef} />
      {measureRect.width ? (
        <Responsive
          {...readOnlyGridProps}
          width={measureRect.width}
          layouts={layouts}
        >
          {children}
        </Responsive>
      ) : null}
    </div>
  );
};

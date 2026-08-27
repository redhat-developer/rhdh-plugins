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

// This complete read-only home page grid picks up the idea and styles from
// https://github.com/backstage/backstage/blob/master/plugins/home
// Esp. from the CustomHomepageGrid component:
// https://github.com/backstage/backstage/blob/master/plugins/home/src/components/CustomHomepage/CustomHomepageGrid.tsx
// but without the drag and drop functionality.

import type { ComponentType, ReactNode } from 'react';

import { useMemo } from 'react';
import { Layout, Responsive } from 'react-grid-layout';

import { ErrorBoundary } from '@backstage/core-components';

import Box from '@mui/material/Box';

import 'react-grid-layout/css/styles.css';

import useMeasure from 'react-use/lib/useMeasure';
import { HomePageCardConfig } from '../types';
import { isCardADefaultConfiguration } from '../utils/nfsLayout';
import {
  GRID_GAP,
  readOnlyGridProps,
  buildCardLayouts,
  aggregateLayouts,
} from '../utils/gridDefaults';
import { cardWrapperSx } from '../styles/cardWrapperSx';

interface Card {
  id: string;
  Component: ComponentType<any> | ReactNode;
  layouts: Record<string, Layout>;
}
/**
 * Props for the read-only grid layout.
 */
export interface ReadOnlyGridLayoutProps {
  homepageCards: HomePageCardConfig[];
}

/**
 * Read-only grid layout for the NFS home page.
 * Respects layout configuration (breakpoints) when provided via app config.
 *
 */
export const ReadOnlyGridLayout = ({
  homepageCards,
}: ReadOnlyGridLayoutProps) => {
  const [measureRef, measureRect] = useMeasure<HTMLDivElement>();

  const cards = useMemo<Card[]>(() => {
    return homepageCards
      .filter(isCardADefaultConfiguration)
      .map<Card>((cardData, index) => {
        const id = (index + 1).toString();
        const layouts = buildCardLayouts(id, cardData.breakpointLayouts);

        const component = cardData.component;
        const RenderContent =
          typeof component === 'object' &&
          component !== null &&
          'Content' in component
            ? (component as { Content: ComponentType<any> }).Content
            : component;

        return { id, Component: RenderContent, layouts };
      });
  }, [homepageCards]);

  const layouts = useMemo(() => aggregateLayouts(cards), [cards]);

  const children = useMemo(() => {
    return cards.map(card => (
      <Box
        key={card.id}
        data-cardid={card.id}
        data-testid={`home-page card ${card.id}`}
        data-layout={JSON.stringify(card.layouts)}
        sx={cardWrapperSx}
      >
        <ErrorBoundary>
          {typeof card.Component === 'function' ? (
            <card.Component />
          ) : (
            card.Component
          )}
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

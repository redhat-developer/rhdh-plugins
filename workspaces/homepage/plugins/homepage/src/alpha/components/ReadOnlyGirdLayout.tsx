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
import {
  Layout,
  Layouts,
  Responsive,
  ResponsiveProps,
} from 'react-grid-layout';

import { ErrorBoundary } from '@backstage/core-components';

import Box from '@mui/material/Box';

// Removes the doubled scrollbar
import 'react-grid-layout/css/styles.css';

import useMeasure from 'react-use/lib/useMeasure';
import { HomePageCardConfig } from '../../types';
import { isCardADefaultConfiguration } from '../utils';

interface Card {
  id: string;
  Component: ComponentType<any> | ReactNode;
  layouts: Record<string, Layout>;
}

const gridGap = 16;

const defaultProps: ResponsiveProps = {
  // Aligned with the 1.0-1.2 home page gap.
  margin: [gridGap, gridGap],
  // Same as in home-plugin CustomHomepageGrid
  rowHeight: 60,

  // We use always a 12-column grid, but each cards can define
  // their number of columns (width) and start column (x) per breakpoint.
  breakpoints: {
    xl: 1600,
    lg: 1200,
    md: 996,
    sm: 768,
    xs: 480,
    xxs: 0,
  },
  cols: {
    xl: 12,
    lg: 12,
    md: 12,
    sm: 12,
    xs: 12,
    xxs: 12,
  },

  isDraggable: false,
  isResizable: false,
  compactType: null,
};

import { cardWrapperSx } from '../../styles/cardWrapperSx';
/**
 * Props for the read-only grid layout.
 * @alpha
 */
export interface ReadOnlyGridLayoutProps {
  homepageCards: HomePageCardConfig[];
}

/**
 * Read-only grid layout for the NFS home page.
 * Respects layout configuration (breakpoints) when provided via app config.
 *
 * @alpha
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
        const layouts: Record<string, Layout> = {};
        if (cardData.breakpointLayouts) {
          for (const [breakpoint, layout] of Object.entries(
            cardData.breakpointLayouts,
          )) {
            layouts[breakpoint] = {
              i: id,
              x: layout.x ?? 0,
              y: layout.y ?? 0,
              w: layout.w ?? 12,
              h: layout.h ?? 4,
              isDraggable: false,
              isResizable: false,
            };
          }
        } else {
          // Default layout for cards without a layout configuration
          ['xl', 'lg', 'md', 'sm', 'xs', 'xxs'].forEach(breakpoint => {
            layouts[breakpoint] = {
              i: id,
              x: 0,
              y: 0,
              w: 12,
              h: 4,
              isDraggable: false,
              isResizable: false,
            };
          });
        }

        // component can be a React element or { Content: ComponentType }; extract renderable node
        const component = cardData.component;
        const RenderContent =
          typeof component === 'object' &&
          component !== null &&
          'Content' in component
            ? (component as { Content: ComponentType<any> }).Content
            : component;

        return {
          id,
          Component: RenderContent,
          layouts,
        };
      });
  }, [homepageCards]);

  const layouts = useMemo<Layouts>(() => {
    const result: Layouts = {};
    for (const card of cards) {
      for (const [breakpoint, layoutPerBreakpoint] of Object.entries(
        card.layouts,
      )) {
        if (!result[breakpoint]) {
          result[breakpoint] = [];
        }
        result[breakpoint].push(layoutPerBreakpoint);
      }
    }
    return result;
  }, [cards]);

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
    <div style={{ margin: -gridGap }}>
      <div ref={measureRef} />
      {measureRect.width ? (
        <Responsive
          {...defaultProps}
          width={measureRect.width}
          layouts={layouts}
        >
          {children}
        </Responsive>
      ) : null}
    </div>
  );
};

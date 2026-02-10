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

import type { ComponentType } from 'react';

import { useMemo } from 'react';
import {
  Layout,
  Layouts,
  Responsive,
  ResponsiveProps,
} from 'react-grid-layout';

import { ErrorBoundary } from '@backstage/core-components';

import { makeStyles } from 'tss-react/mui';

// Removes the doubled scrollbar
import 'react-grid-layout/css/styles.css';

import useMeasure from 'react-use/lib/useMeasure';

import { HomePageCardMountPoint } from '../types';
import { isCardADefaultConfiguration } from '../utils/customizable-cards';

interface Card {
  id: string;
  Component: ComponentType<any>;
  props?: Record<string, any>;
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

const useStyles = makeStyles()({
  // Make card content scrollable (so that cards don't overlap)
  cardWrapper: {
    height: '100%',
    minHeight: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    '& > div[class*="MuiCard-root"]': {
      width: '100%',
      height: '100%',
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    '& div[class*="MuiCardContent-root"]': {
      overflow: 'auto',
    },
  },
});

/**
 * @public
 */
export interface ReadOnlyGridProps {
  mountPoints: HomePageCardMountPoint[];
}

/**
 * @public
 */
export const ReadOnlyGrid = ({ mountPoints }: ReadOnlyGridProps) => {
  const { classes } = useStyles();
  const [measureRef, measureRect] = useMeasure<HTMLDivElement>();

  const cards = useMemo<Card[]>(() => {
    return mountPoints
      .filter(isCardADefaultConfiguration)
      .map<Card>((cardMountPoint, index) => {
        const id = (index + 1).toString();
        const layouts: Record<string, Layout> = {};

        if (cardMountPoint.config?.layouts) {
          for (const [breakpoint, layout] of Object.entries(
            cardMountPoint.config.layouts,
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

        return {
          id,
          Component: cardMountPoint.Component,
          props: cardMountPoint.config?.props,
          layouts,
        };
      });
  }, [mountPoints]);

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
      <div
        key={card.id}
        data-cardid={card.id}
        data-testid={`home-page card ${card.id}`}
        data-layout={JSON.stringify(card.layouts)}
        className={classes.cardWrapper}
      >
        <ErrorBoundary>
          <card.Component {...card.props} />
        </ErrorBoundary>
      </div>
    ));
  }, [cards, classes.cardWrapper]);

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

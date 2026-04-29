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

import 'react-grid-layout/css/styles.css';

import useMeasure from 'react-use/lib/useMeasure';

import type { VisibleDefaultWidget } from '../api/DefaultWidgetsApiClient';
import { HomePageCardMountPoint } from '../types';

interface Card {
  id: string;
  Component: ComponentType<any>;
  props?: Record<string, unknown>;
  layouts: Record<string, Layout>;
}

const gridGap = 16;

const defaultProps: ResponsiveProps = {
  margin: [gridGap, gridGap],
  rowHeight: 60,

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
  cardWrapper: {
    '& > div[class*="MuiCard-root"]': {
      width: '100%',
      height: '100%',
    },
    '& div[class*="MuiCardContent-root"]': {
      overflow: 'auto',
    },
  },
});

export interface DefaultWidgetsReadOnlyGridProps {
  defaultWidgets: VisibleDefaultWidget[];
  mountPoints: HomePageCardMountPoint[];
}

export const DefaultWidgetsReadOnlyGrid = ({
  defaultWidgets,
  mountPoints,
}: DefaultWidgetsReadOnlyGridProps) => {
  const { classes } = useStyles();
  const [measureRef, measureRect] = useMeasure<HTMLDivElement>();

  const mountPointsByRef = useMemo(() => {
    const map = new Map<string, HomePageCardMountPoint>();
    for (const mp of mountPoints) {
      if (mp.config?.id) {
        map.set(mp.config.id, mp);
      }
    }
    return map;
  }, [mountPoints]);

  const cards = useMemo<Card[]>(() => {
    return defaultWidgets
      .map<Card | null>((widget, index) => {
        const mountPoint = mountPointsByRef.get(widget.ref);
        if (!mountPoint) {
          // eslint-disable-next-line no-console
          console.warn(
            `No mount point found for widget with ref ${widget.ref}. Available mount points: ${[...mountPointsByRef.keys()].join(', ')}`,
          );
          return null;
        }

        const id = (index + 1).toString();
        const layouts: Record<string, Layout> = {};
        const widgetLayout = widget.layout as
          | Record<string, { x?: number; y?: number; w?: number; h?: number }>
          | undefined;

        if (widgetLayout) {
          for (const [breakpoint, layout] of Object.entries(widgetLayout)) {
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
          Component: mountPoint.Component,
          props: widget.props,
          layouts,
        };
      })
      .filter((card): card is Card => card !== null);
  }, [defaultWidgets, mountPointsByRef]);

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

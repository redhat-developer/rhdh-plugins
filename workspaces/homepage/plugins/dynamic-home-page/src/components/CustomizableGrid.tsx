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
import { Layout } from 'react-grid-layout';
import GlobalStyles from '@mui/material/GlobalStyles';
import { useTheme } from '@mui/material/styles';

import { ErrorBoundary } from '@backstage/core-components';
import { CustomHomepageGrid } from '@backstage/plugin-home';
import { attachComponentData } from '@backstage/core-plugin-api';

import { makeStyles } from 'tss-react/mui';

// Removes the doubled scrollbar
import 'react-grid-layout/css/styles.css';

import { HomePageCardMountPoint } from '../types';

interface Card {
  id: string;
  Component: ComponentType<any>;
  props?: Record<string, any>;
  layouts: Record<string, Layout>;
}

const useStyles = makeStyles()({
  // Make card content scrollable (so that cards don't overlap)
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

/**
 * @public
 */
export interface CustomizableGridProps {
  mountPoints: HomePageCardMountPoint[];
  defaultMountPoints?: HomePageCardMountPoint[]; // For config prop - only default cards
  breakpoints?: Record<string, number>;
  cols?: Record<string, number>;
}

/**
 * @public
 */
export const CustomizableGrid = (props: CustomizableGridProps) => {
  const { classes } = useStyles();
  const theme = useTheme();

  const cards = useMemo<Card[]>(() => {
    if (!props.mountPoints || !Array.isArray(props.mountPoints)) {
      return [];
    }

    return props.mountPoints.map<Card>((mountPoint, index) => {
      const id = (index + 1).toString();
      const layouts: Record<string, Layout> = {};

      // Apply config-based metadata to component if provided (skip if already exists)
      if (mountPoint.config?.title) {
        try {
          attachComponentData(
            mountPoint.Component,
            'title',
            mountPoint.config.title,
          );
        } catch (error) {
          // Ignore duplicate metadata errors - component already has title
        }
      }
      if (mountPoint.config?.description) {
        try {
          attachComponentData(
            mountPoint.Component,
            'description',
            mountPoint.config.description,
          );
        } catch (error) {
          // Ignore duplicate metadata errors - component already has description
        }
      }

      if (mountPoint.config?.layouts) {
        for (const [breakpoint, layout] of Object.entries(
          mountPoint.config.layouts,
        )) {
          layouts[breakpoint] = {
            i: id,
            x: layout.x ?? 0,
            y: layout.y ?? 0,
            w: layout.w ?? 12,
            h: layout.h ?? 4,
            isDraggable: true,
            isResizable: true,
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
            isDraggable: true,
            isResizable: true,
          };
        });
      }

      return {
        id,
        Component: mountPoint.Component,
        props: mountPoint.config?.props,
        layouts,
      };
    });
  }, [props.mountPoints]);

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

  // Create default layout configuration for "restore defaults" functionality
  // Use only default mount points for restore defaults, but all mount points for "Add widget" dialog
  const defaultConfig = useMemo(() => {
    const configMountPoints = props.defaultMountPoints || []; // Use only default cards for restore

    if (!configMountPoints || configMountPoints.length === 0) {
      return [];
    }

    return configMountPoints.map((mountPoint, index) => {
      const layout = mountPoint.config?.layouts?.xl || {};

      return {
        component: (
          <mountPoint.Component {...(mountPoint.config?.props || {})} />
        ),
        x: layout.x ?? 0,
        y: layout.y ?? index * 5,
        width: layout.w ?? 12,
        height: layout.h ?? 4,
        movable: true,
        resizable: true,
        draggable: true,
        deletable: true,
      };
    });
  }, [props.defaultMountPoints]);

  return (
    <>
      <GlobalStyles
        styles={{
          '[class*="makeStyles-settingsOverlay"]': {
            backgroundColor:
              theme.palette.mode === 'dark'
                ? 'rgba(20, 20, 20, 0.95) !important'
                : 'rgba(40, 40, 40, 0.93) !important',
          },
        }}
      />
      <CustomHomepageGrid
        config={defaultConfig}
        preventCollision={false}
        compactType="vertical"
      >
        {children}
      </CustomHomepageGrid>
    </>
  );
};

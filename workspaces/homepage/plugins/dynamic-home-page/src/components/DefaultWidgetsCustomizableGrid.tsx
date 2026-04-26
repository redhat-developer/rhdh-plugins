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

import type { ReactElement } from 'react';
import { useMemo, useRef } from 'react';

import {
  CustomHomepageGrid,
  LayoutConfiguration,
} from '@backstage/plugin-home';
import {
  ComponentParts,
  createCardExtension,
} from '@backstage/plugin-home-react';

import GlobalStyles from '@mui/material/GlobalStyles';
import { useTheme } from '@mui/material/styles';

import 'react-grid-layout/css/styles.css';

import type { VisibleDefaultWidget } from '../api/DefaultWidgetsApiClient';
import { HomePageCardMountPoint } from '../types';
import { dynamicHomePagePlugin } from '../plugin';
import { useTranslation } from '../hooks/useTranslation';
import { useContainerQuery } from '../hooks/useContainerQuery';
import { getCardTitle, getCardDescription } from '../utils/customizable-cards';

export interface DefaultWidgetsCustomizableGridProps {
  defaultWidgets: VisibleDefaultWidget[];
  mountPoints: HomePageCardMountPoint[];
}

export const DefaultWidgetsCustomizableGrid = ({
  defaultWidgets,
  mountPoints,
}: DefaultWidgetsCustomizableGridProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const gridContainerRef = useRef<HTMLDivElement>(null);
  useContainerQuery(gridContainerRef, { notifyWindowResize: true });

  const defaultWidgetsByRef = useMemo(() => {
    const map = new Map<string, VisibleDefaultWidget>();
    for (const w of defaultWidgets) {
      map.set(w.ref, w);
    }
    return map;
  }, [defaultWidgets]);

  const { children, config } = useMemo(() => {
    const childDictionary: Record<
      string,
      { child: ReactElement; title: string | undefined }
    > = {};

    const defaultConfig: LayoutConfiguration[] = [];

    mountPoints.forEach(mountPoint => {
      if (!mountPoint.config?.id) {
        return;
      }
      const id = mountPoint.config.id;
      const title = getCardTitle(t, mountPoint);
      const description = getCardDescription(t, mountPoint);

      const automaticallyWrapInInfoCard = false;

      const componentParts: ComponentParts = {
        Content: props => (
          <mountPoint.Component {...mountPoint.config!.props} {...props} />
        ),
        Actions: mountPoint.Actions as () => JSX.Element,
        Settings: mountPoint.Settings as () => JSX.Element,
        ContextProvider: automaticallyWrapInInfoCard
          ? undefined
          : props => (
              <mountPoint.Component {...mountPoint.config!.props} {...props} />
            ),
      };

      const cardExtension = createCardExtension({
        name: id,
        title,
        description,
        layout: mountPoint.config.cardLayout,
        settings: mountPoint.config.settings,
        components: () => Promise.resolve(componentParts),
      });

      const Card = dynamicHomePagePlugin.provide(cardExtension);

      childDictionary[id] = {
        child: <Card />,
        title,
      };

      const widget = defaultWidgetsByRef.get(id);
      if (!widget) {
        // eslint-disable-next-line no-console
        console.warn(
          `No mount point found for widget with ref ${id}. Available mount points: ${[...defaultWidgetsByRef.keys()].join(', ')}`,
        );
        return;
      }

      const widgetLayout = widget.layout as
        | Record<string, { x?: number; y?: number; w?: number; h?: number }>
        | undefined;
      const layout = widgetLayout?.xl ?? {};

      defaultConfig.push({
        component: id,
        x: layout.x ?? 0,
        y: layout.y ?? 0,
        width: layout.w ?? 12,
        height: layout.h ?? 4,
        movable: true,
        deletable: true,
        resizable: true,
      });
    });

    return {
      children: Object.values(childDictionary)
        .sort((a, b) =>
          a.title && b.title ? a.title.localeCompare(b.title) : 0,
        )
        .map(e => e.child),
      config: defaultConfig,
    };
  }, [mountPoints, defaultWidgetsByRef, t]);

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
      <div
        ref={gridContainerRef}
        style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}
      >
        <CustomHomepageGrid
          config={config}
          preventCollision={false}
          compactType="vertical"
          style={{ margin: '-10px' }}
        >
          {children}
        </CustomHomepageGrid>
      </div>
    </>
  );
};

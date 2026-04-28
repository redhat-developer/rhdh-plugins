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

  const mountPointsById = useMemo(() => {
    const map = new Map<string, HomePageCardMountPoint>();
    for (const mp of mountPoints) {
      if (mp.config?.id) {
        map.set(mp.config.id, mp);
      }
    }
    return map;
  }, [mountPoints]);

  const widgetsToRender = useMemo(() => {
    // If config exists, use it exclusively; otherwise fall back to mount points
    if (defaultWidgets.length > 0) {
      return defaultWidgets.map((widget, index) => ({
        id: widget.id || `config-widget-${index}`,
        ref: widget.ref,
        layout: widget.layout,
        source: 'config' as const,
      }));
    }

    // Fallback: render all mount points
    return mountPoints
      .filter(mp => mp.config?.id)
      .map(mp => ({
        id: mp.config!.id,
        ref: mp.config!.id,
        layout: undefined,
        source: 'mountpoint' as const,
      }));
  }, [defaultWidgets, mountPoints]);

  const { children, config } = useMemo(() => {
    const childDictionary: Record<
      string,
      { child: ReactElement; title: string | undefined }
    > = {};
    const defaultConfig: LayoutConfiguration[] = [];

    widgetsToRender.forEach(widget => {
      const widgetId = widget.id;
      const widgetRef = widget.ref ?? widgetId;
      if (!widgetId || !widgetRef) {
        // eslint-disable-next-line no-console
        console.warn(
          `Widget missing id or ref (id: ${String(widget.id)}, ref: ${String(widget.ref)}).`,
        );
        return;
      }

      const mountPoint = mountPointsById.get(widgetRef);

      if (!mountPoint || !mountPoint.config?.id) {
        // eslint-disable-next-line no-console
        console.warn(
          `No mount point found for widget ref ${widgetRef}. Available mount points: ${[...mountPointsById.keys()].join(', ')}`,
        );
        return;
      }

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
        name: widgetId,
        title,
        description,
        layout: mountPoint.config.cardLayout,
        settings: mountPoint.config.settings,
        components: () => Promise.resolve(componentParts),
      });

      const Card = dynamicHomePagePlugin.provide(cardExtension);

      childDictionary[widgetId] = {
        child: <Card />,
        title,
      };

      const widgetLayout = widget.layout as
        | Record<string, { x?: number; y?: number; w?: number; h?: number }>
        | undefined;
      const layout = widgetLayout?.xl ?? {};

      defaultConfig.push({
        component: widgetId,
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
  }, [widgetsToRender, mountPointsById, t]);

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

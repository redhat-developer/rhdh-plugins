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
import { getTranslatedTextWithFallback } from '../translations/utils';

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

  const { children, config } = useMemo(() => {
    const childDictionary: Record<
      string,
      { child: ReactElement; title: string | undefined }
    > = {};
    const defaultConfig: LayoutConfiguration[] = [];

    mountPoints.forEach(mountPoint => {
      const mountPointId = mountPoint.config?.id;
      if (!mountPointId) {
        // eslint-disable-next-line no-console
        console.warn(
          `Skipping homepage mount point without config.id: ${JSON.stringify(mountPoint)}`,
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
        name: mountPointId,
        title,
        description,
        layout: mountPoint.config!.cardLayout,
        settings: mountPoint.config!.settings,
        components: () => Promise.resolve(componentParts),
      });

      const Card = dynamicHomePagePlugin.provide(cardExtension);

      // Make mount points available as 'addable' cards.
      childDictionary[mountPointId] = {
        child: <Card key={mountPointId} />,
        title,
      };
    });

    defaultWidgets.forEach(defaultWidget => {
      const mountPoint = mountPointsById.get(defaultWidget.ref);
      if (!mountPoint) {
        // eslint-disable-next-line no-console
        console.warn(
          `Homepage default widget has invalid ref (id: ${defaultWidget.id}, ref: ${defaultWidget.ref}). No matching mount point found. Available mount points ids: ${Array.from(mountPointsById.keys()).join(', ')}. This widget will not be displayed!`,
        );
        return;
      }

      // Make default widgets available as 'addable' cards because they can have custom props!
      let cardId = defaultWidget.ref;
      if (defaultWidget.props) {
        cardId = defaultWidget.id;

        const title = getTranslatedTextWithFallback(
          t,
          defaultWidget.props.titleKey as string | undefined,
          defaultWidget.props.title as string | undefined,
        );
        let description =
          getTranslatedTextWithFallback(
            t,
            defaultWidget.props.descriptionKey as string | undefined,
            defaultWidget.props.description as string | undefined,
          ) ??
          (defaultWidget.props.title as string | undefined) ??
          (defaultWidget.props.debugContent as string | undefined);
        if (title === description) {
          description = undefined;
        }

        const automaticallyWrapInInfoCard = false;

        const componentParts: ComponentParts = {
          Content: props => (
            <mountPoint.Component
              {...mountPoint.config!.props}
              {...defaultWidget.props}
              {...props}
            />
          ),
          Actions: mountPoint.Actions as () => JSX.Element,
          Settings: mountPoint.Settings as () => JSX.Element,
          ContextProvider: automaticallyWrapInInfoCard
            ? undefined
            : props => (
                <mountPoint.Component
                  {...mountPoint.config!.props}
                  {...defaultWidget.props}
                  {...props}
                />
              ),
        };

        const cardExtension = createCardExtension({
          name: cardId,
          title,
          description,
          layout: mountPoint.config!.cardLayout,
          settings: mountPoint.config!.settings,
          components: () => Promise.resolve(componentParts),
        });

        const Card = dynamicHomePagePlugin.provide(cardExtension);

        childDictionary[cardId] = {
          child: <Card key={cardId} />,
          title,
        };
      }

      const widgetLayout = defaultWidget.layout as
        | Record<string, { x?: number; y?: number; w?: number; h?: number }>
        | undefined;
      const layout = widgetLayout?.xl ?? {};
      defaultConfig.push({
        component: cardId,
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
  }, [defaultWidgets, mountPoints, mountPointsById, t]);

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

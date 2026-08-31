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
import { useMemo } from 'react';

import { LayoutConfiguration } from '@backstage/plugin-home';
import {
  ComponentParts,
  createCardExtension,
} from '@backstage/plugin-home-react';

import { HomePageCardMountPoint } from '../../types';
import { dynamicHomePagePlugin } from '../plugin';
import { useTranslation } from '../../hooks/useTranslation';
import {
  isCardADefaultConfiguration,
  getCardTitle,
  getCardDescription,
} from '../../utils/customizable-cards';
import { CustomizableGridShell } from './CustomizableGridShell';

/**
 * @public
 */
export interface CustomizableGridProps {
  mountPoints: HomePageCardMountPoint[];
}

/**
 * @public
 */
export const CustomizableGrid = ({ mountPoints }: CustomizableGridProps) => {
  const { t } = useTranslation();

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

      if (isCardADefaultConfiguration(mountPoint)) {
        const layout = mountPoint.config?.layouts?.xl || {};

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
      }
    });

    return {
      children: Object.values(childDictionary)
        .sort((a, b) =>
          a.title && b.title ? a.title.localeCompare(b.title) : 0,
        )
        .map(e => e.child),
      config: defaultConfig,
    };
  }, [mountPoints, t]);

  return (
    <CustomizableGridShell config={config}>{children}</CustomizableGridShell>
  );
};

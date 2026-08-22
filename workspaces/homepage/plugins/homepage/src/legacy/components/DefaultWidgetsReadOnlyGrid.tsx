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

import { useMemo } from 'react';

import type { VisibleDefaultWidget } from '../../api/DefaultWidgetsApiClient';
import { HomePageCardMountPoint } from '../../types';
import { buildCardLayouts } from '../../utils/gridDefaults';
import { GridCard, ReadOnlyGridShell } from './ReadOnlyGridShell';

export interface DefaultWidgetsReadOnlyGridProps {
  defaultWidgets: VisibleDefaultWidget[];
  mountPoints: HomePageCardMountPoint[];
}

export const DefaultWidgetsReadOnlyGrid = ({
  defaultWidgets,
  mountPoints,
}: DefaultWidgetsReadOnlyGridProps) => {
  const mountPointsByRef = useMemo(() => {
    const map = new Map<string, HomePageCardMountPoint>();
    for (const mp of mountPoints) {
      if (mp.config?.id) {
        map.set(mp.config.id, mp);
      }
    }
    return map;
  }, [mountPoints]);

  const cards = useMemo<GridCard[]>(() => {
    return defaultWidgets
      .map<GridCard | null>((widget, index) => {
        const mountPoint = mountPointsByRef.get(widget.ref);
        if (!mountPoint) {
          // eslint-disable-next-line no-console
          console.warn(
            `No mount point found for widget with ref ${widget.ref}. Available mount points: ${[...mountPointsByRef.keys()].join(', ')}`,
          );
          return null;
        }

        const id = (index + 1).toString();
        const widgetLayout = widget.layout as
          | Record<string, { x?: number; y?: number; w?: number; h?: number }>
          | undefined;
        const layouts = buildCardLayouts(id, widgetLayout);

        return {
          id,
          Component: mountPoint.Component,
          props: { ...mountPoint.config?.props, ...widget.props },
          layouts,
        };
      })
      .filter((card): card is GridCard => card !== null);
  }, [defaultWidgets, mountPointsByRef]);

  return <ReadOnlyGridShell cards={cards} />;
};

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

import { HomePageCardMountPoint } from '../../types';
import { isCardADefaultConfiguration } from '../../utils/customizable-cards';
import { buildCardLayouts } from '../../utils/gridDefaults';
import { GridCard, ReadOnlyGridShell } from './ReadOnlyGridShell';

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
  const cards = useMemo<GridCard[]>(() => {
    return mountPoints
      .filter(isCardADefaultConfiguration)
      .map<GridCard>((cardMountPoint, index) => {
        const id = (index + 1).toString();
        const layouts = buildCardLayouts(id, cardMountPoint.config?.layouts);

        return {
          id,
          Component: cardMountPoint.Component,
          props: cardMountPoint.config?.props,
          layouts,
        };
      });
  }, [mountPoints]);

  return <ReadOnlyGridShell cards={cards} />;
};

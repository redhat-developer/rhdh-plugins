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

import { useScalprum } from '@scalprum/react-core';

import { HomePageCardMountPoint } from '../types';
import { useMemo } from 'react';

interface ScalprumState {
  api?: {
    dynamicRootConfig?: {
      mountPoints?: {
        'home.page/cards': HomePageCardMountPoint[];
      };
    };
  };
}

export const useCardMountPoints = (): HomePageCardMountPoint[] => {
  const scalprum = useScalprum<ScalprumState>();

  const cards =
    scalprum?.api?.dynamicRootConfig?.mountPoints?.['home.page/cards'];

  return useMemo(() => {
    if (!cards || !Array.isArray(cards)) {
      return [];
    }

    const filteredAndSorted = cards.filter(
      card =>
        // card.Component &&
        card.enabled !== false &&
        (!card.config?.priority || card.config.priority >= 0),
    );

    filteredAndSorted.sort(
      (a, b) => (b.config?.priority ?? 0) - (a.config?.priority ?? 0),
    );

    return filteredAndSorted;
  }, [cards]);
};

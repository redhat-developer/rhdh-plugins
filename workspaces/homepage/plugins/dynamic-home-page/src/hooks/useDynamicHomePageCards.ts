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

interface ScalprumState {
  api?: {
    dynamicRootConfig?: {
      mountPoints?: {
        'home.page/cards': HomePageCardMountPoint[]; // Default cards
        'home.page/widgets': HomePageCardMountPoint[]; // Additional cards from plugins
      };
    };
  };
}

/**
 * Hook to get all available homepage cards from both default and additional mount points
 */
export const useDynamicHomePageCards = (): {
  defaultCards: HomePageCardMountPoint[];
  additionalCards: HomePageCardMountPoint[];
  allCards: HomePageCardMountPoint[];
} => {
  const scalprum = useScalprum<ScalprumState>();

  const defaultCards =
    scalprum?.api?.dynamicRootConfig?.mountPoints?.['home.page/cards'] || [];

  const additionalCards =
    scalprum?.api?.dynamicRootConfig?.mountPoints?.['home.page/widgets'] || [];

  // Combine all cards - ensure they're arrays
  const allCards = [
    ...(Array.isArray(defaultCards) ? defaultCards : []),
    ...(Array.isArray(additionalCards) ? additionalCards : []),
  ];

  return {
    defaultCards: Array.isArray(defaultCards) ? defaultCards : [],
    additionalCards: Array.isArray(additionalCards) ? additionalCards : [],
    allCards,
  };
};

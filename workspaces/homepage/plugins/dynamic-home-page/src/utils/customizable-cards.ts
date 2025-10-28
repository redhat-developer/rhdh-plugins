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

import { TranslationFunction } from '@backstage/core-plugin-api/alpha';

import { HomePageCardMountPoint } from '../types';
import { homepageTranslationRef } from '../translations';
import { getTranslatedTextWithFallback } from '../translations/utils';

/**
 * Util function that decides if a `home.page/card` mount point will be rendered
 * as 'default card' or just as 'available card'.
 *
 * This is needed when customization is enabled and if customers might adopt
 * the customization in yaml feature previously.
 *
 * 1. Card mount points with a `config.layout` should be shown by default.
 * 2. Card mount points without a name should be shown by default as well.
 *    This is for backward compatibilty.
 */
export function isCardADefaultConfiguration(
  cardMountPoint: HomePageCardMountPoint,
): boolean {
  return !!cardMountPoint.config?.layouts || !cardMountPoint.config?.name;
}

function getComponentDisplayName(
  cardMountPoint: HomePageCardMountPoint,
): string | undefined {
  const displayName = cardMountPoint.Component.displayName;
  if (displayName?.includes('Extension(')) {
    return displayName.replace('Extension(', '').replace(')', '');
  }
  return displayName;
}

export function getCardName(
  cardMountPoint: HomePageCardMountPoint,
): string | undefined {
  return cardMountPoint.config?.name ?? getComponentDisplayName(cardMountPoint);
}

export function getCardTitle(
  t: TranslationFunction<typeof homepageTranslationRef.T>,
  cardMountPoint: HomePageCardMountPoint,
): string | undefined {
  return (
    getTranslatedTextWithFallback(
      t,
      cardMountPoint.config?.titleKey,
      cardMountPoint.config?.title,
    ) ??
    cardMountPoint.config?.name ??
    getComponentDisplayName(cardMountPoint)
  );
}

export function getCardDescription(
  t: TranslationFunction<typeof homepageTranslationRef.T>,
  cardMountPoint: HomePageCardMountPoint,
): string | undefined {
  return (
    getTranslatedTextWithFallback(
      t,
      cardMountPoint.config?.descriptionKey,
      cardMountPoint.config?.description,
    ) ??
    cardMountPoint.config?.props?.title ??
    cardMountPoint.config?.props?.debugContent
  );
}

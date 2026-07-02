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

import {
  cloneElement,
  isValidElement,
  type ComponentType,
  type ReactElement,
} from 'react';

import { HomePageCardConfig } from '../types';
import {
  getTranslatedTextWithFallback,
  type HomepageTranslateFn,
} from '../translations/utils';
import { widgetTranslationKeysByName } from './widgetTranslationKeys';
import { updateWidgetComponentData } from './updateWidgetComponentData';

type HomePageWidgetElement = ReactElement<{ title?: string }>;

export type TranslateHomepageWidgetTranslationFn = HomepageTranslateFn;

export function translateHomepageWidget(
  card: HomePageCardConfig,
  t: TranslateHomepageWidgetTranslationFn,
): HomePageCardConfig {
  const keys = card.name ? widgetTranslationKeysByName[card.name] : undefined;
  if (!keys || !isValidElement(card.component)) {
    return card;
  }

  const fallbackTitle = card.title ?? card.name;
  const title =
    getTranslatedTextWithFallback(t, keys.titleKey, fallbackTitle) ??
    fallbackTitle;
  const description = keys.descriptionKey
    ? (getTranslatedTextWithFallback(
        t,
        keys.descriptionKey,
        card.description,
      ) ?? card.description)
    : card.description;

  const widgetType = card.component.type as ComponentType;

  updateWidgetComponentData(widgetType, 'title', title);
  updateWidgetComponentData(
    widgetType,
    'description',
    keys.descriptionKey ? description : undefined,
  );

  return {
    ...card,
    title,
    description,
    component: keys.hideTitleOnCard
      ? card.component
      : cloneElement(card.component as HomePageWidgetElement, { title }),
  };
}

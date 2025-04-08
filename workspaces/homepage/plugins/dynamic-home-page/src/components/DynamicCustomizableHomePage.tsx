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

import React from 'react';

import type { ClockConfig } from '@backstage/plugin-home';

import { useDynamicHomePageCards } from '../hooks/useDynamicHomePageCards';
import { CustomizableHomePage } from './CustomizableHomePage';
import type { LocalClockProps } from './LocalClock';

/**
 * This type is similar to Omit&lt;HomePageProps, 'cards'&gt;.
 * We redefine it here to avoid the need to export HomePageProps to the API export!
 * @public
 */
export interface DynamicCustomizableHomePageProps {
  title?: string;
  personalizedTitle?: string;
  pageTitle?: string;
  subtitle?: string;
  localClock?: LocalClockProps;
  worldClocks?: ClockConfig[];
}

/**
 * @public
 */
export const DynamicCustomizableHomePage = (
  props: DynamicCustomizableHomePageProps,
) => {
  const cards = useDynamicHomePageCards();

  return <CustomizableHomePage {...props} cards={cards} />;
};

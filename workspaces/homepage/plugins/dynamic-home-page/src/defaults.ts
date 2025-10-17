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

export type Breakpoints = 'xl' | 'lg' | 'md' | 'sm' | 'xs' | 'xxs';

// prettier-ignore
export const commonWidths: Record<string, Record<Breakpoints, number>> = {
  small: { xl: 2, lg: 2, md: 2, sm: 3, xs: 4, xxs: 2 },
  half:  { xl: 2, lg: 2, md: 2, sm: 3, xs: 4, xxs: 2 },
  '1/2': { xl: 2, lg: 2, md: 2, sm: 3, xs: 4, xxs: 2 },
  '1/3': { xl: 2, lg: 2, md: 2, sm: 3, xs: 4, xxs: 2 },
  '2/2': { xl: 2, lg: 2, md: 2, sm: 3, xs: 4, xxs: 2 },
  full:  { xl: 2, lg: 2, md: 2, sm: 3, xs: 4, xxs: 2 },
};

// prettier-ignore
export const commonHeights: Record<string, Record<Breakpoints, number>> = {
  tiny:     { xl: 1, lg: 1, md: 1, sm: 1, xs: 1, xxs: 1 },
  small:    { xl: 2, lg: 2, md: 2, sm: 2, xs: 2, xxs: 2 },
  medium:   { xl: 4, lg: 4, md: 4, sm: 4, xs: 4, xxs: 4 },
  large:    { xl: 6, lg: 6, md: 6, sm: 6, xs: 6, xxs: 6 },
  xlarge:   { xl: 10, lg: 6, md: 6, sm: 6, xs: 6, xxs: 6 },
  xxlarge:  { xl: 14, lg: 6, md: 6, sm: 6, xs: 6, xxs: 6 },
};

/**
 * Default layout configurations for homepage cards
 * @public
 */
export const defaultLayouts = {
  onboarding: {
    xl: { w: 12, h: 6 },
    lg: { w: 12, h: 6 },
    md: { w: 12, h: 7 },
    sm: { w: 12, h: 8 },
    xs: { w: 12, h: 9 },
    xxs: { w: 12, h: 14 },
  },
  entity: {
    xl: { w: 12, h: 7 },
    lg: { w: 12, h: 7 },
    md: { w: 12, h: 8 },
    sm: { w: 12, h: 9 },
    xs: { w: 12, h: 11 },
    xxs: { w: 12, h: 15 },
  },
  template: {
    xl: { w: 12, h: 5 },
    lg: { w: 12, h: 5 },
    md: { w: 12, h: 5 },
    sm: { w: 12, h: 5 },
    xs: { w: 12, h: 7.5 },
    xxs: { w: 12, h: 13.5 },
  },
  quickAccessCard: {
    xl: { w: 6, h: 8, x: 6 },
    lg: { w: 6, h: 8, x: 6 },
    md: { w: 6, h: 8, x: 6 },
    sm: { w: 12, h: 8, x: 6 },
    xs: { w: 12, h: 8, x: 6 },
    xxs: { w: 12, h: 8, x: 6 },
  },
};

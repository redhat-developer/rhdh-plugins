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

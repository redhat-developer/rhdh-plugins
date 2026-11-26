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

import { PageTheme, genPageTheme, shapes } from '@backstage/theme';

/**
 * Create the theme entries for the app pages based on the current palette
 * @param palette
 * @returns
 */
export function createPagesDarkTheme(): Record<string, PageTheme> {
  const gradientLeft = 'rgb(0, 0, 208)';
  const gradientRight = 'rgb(255, 246, 140)';
  return {
    home: genPageTheme({
      colors: [gradientLeft, gradientRight],
      shape: 'none',
    }),
    app: genPageTheme({
      colors: [gradientLeft, gradientRight],
      shape: shapes.wave,
    }),
    apis: genPageTheme({
      colors: [gradientLeft, gradientRight],
      shape: shapes.wave,
    }),
    documentation: genPageTheme({
      colors: [gradientLeft, gradientRight],
      shape: shapes.wave,
    }),
    tool: genPageTheme({
      colors: [gradientLeft, gradientRight],
      shape: shapes.round,
    }),
    other: genPageTheme({
      colors: [gradientLeft, gradientRight],
      shape: 'none',
    }),
  };
}

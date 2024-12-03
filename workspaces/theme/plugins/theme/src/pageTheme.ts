/*
 * Copyright 2024 The Backstage Authors
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
import { ThemeColors } from './types';

export const pageTheme = (input: ThemeColors): Record<string, PageTheme> => {
  const { headerColor1, headerColor2 } = input;
  const defaultColors = ['#005f60', '#73c5c5'];
  const headerColor = [
    headerColor1 || defaultColors[0],
    headerColor2 || defaultColors[1],
  ];
  return {
    home: genPageTheme({
      colors: [headerColor[0], headerColor[1]],
      shape: shapes.wave,
    }),
    app: genPageTheme({
      colors: [headerColor[0], headerColor[1]],
      shape: shapes.wave,
    }),
    apis: genPageTheme({
      colors: [headerColor[0], headerColor[1]],
      shape: shapes.wave,
    }),
    documentation: genPageTheme({
      colors: [headerColor[0], headerColor[1]],
      shape: shapes.wave,
    }),
    tool: genPageTheme({
      colors: [headerColor[0], headerColor[1]],
      shape: shapes.round,
    }),
    other: genPageTheme({
      colors: [headerColor[0], headerColor[1]],
      shape: shapes.wave,
    }),
  };
};

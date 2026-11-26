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
import { ThemeConfigPageTheme } from '../types';

/**
 * Creates a page theme from a page theme configuration (app-config.yaml).
 *
 * This allows the user to specificy a custom header with:
 *
 *  * `backgroundColor` or `colors` like `'#ff0000'`, `['#ff0000']` or `['#ff0000', '#00ff00', '#0000ff']`.
 *
 *    More then one color will create a gradient from left to right.
 *
 *  * a `shape` like `round`, `wave`, `wave2`, or `none`.
 *
 *  * or an `backgroundImage` that supports different types of images references:
 *
 *    1. CSS urls like `data:image/svg+xml,...` or `url(data:image/svg+xml,...)`
 *    2. Absolute or relative URLs starting with `http://`, `https://` or `/`
 *    3. Inline <svg>...</svg> images will be transformed to `url(data:image/svg+xml,<svg>...</svg>)`
 *
 *  * `fontColor` like `'#ffffff'` or `'#000000'`
 */
export const createPageTheme = (
  pageThemeConfig: ThemeConfigPageTheme,
): PageTheme => {
  let colors = pageThemeConfig.backgroundColor ?? pageThemeConfig.colors;
  if (typeof colors === 'string') {
    colors = [colors];
  } else if (!colors?.length) {
    colors = ['transparent'];
  }

  let shape =
    pageThemeConfig.backgroundImage ??
    shapes[pageThemeConfig.shape as string] ??
    pageThemeConfig.shape ??
    'none';
  if (
    shape.startsWith('data:') ||
    shape.startsWith('http://') ||
    shape.startsWith('https://') ||
    shape.startsWith('/')
  ) {
    shape = `url("${shape}")`;
  } else if (shape.startsWith('<svg') && shape.endsWith('>')) {
    shape = `url("data:image/svg+xml,${encodeURIComponent(shape)}")`;
  }

  // https://github.com/backstage/backstage/blob/master/packages/theme/src/base/pageTheme.ts#L59-L87
  return genPageTheme({
    colors,
    shape,
    options: {
      fontColor: pageThemeConfig.fontColor, // default is white in genPageTheme!
    },
  });
};

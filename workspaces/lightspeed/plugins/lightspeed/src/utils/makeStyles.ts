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

import { useMemo } from 'react';

import createCache from '@emotion/cache';
import { serializeStyles } from '@emotion/serialize';
import type { CSSInterpolation } from '@emotion/serialize';
import { insertStyles, registerStyles } from '@emotion/utils';
import type { Theme } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';

/**
 * Emotion-backed makeStyles uses `useTheme` from `@mui/material` (MUI v5).
 * Unlike MUI v4, `theme.spacing(n)` returns strings with units (e.g. `"8px"`).
 * Do not append `px` after `theme.spacing(...)` in style objects — that produces
 * invalid values like `16pxpx` and drops the whole declaration in the browser.
 */
const emotionCache = createCache({ key: 'ls' });

type StylesObj<K extends string> = Record<K, CSSInterpolation>;

function cssClass(style: CSSInterpolation): string {
  const serialized = serializeStyles([style as any], emotionCache.registered);
  registerStyles(emotionCache, serialized, false);
  insertStyles(emotionCache, serialized, false);
  return `${emotionCache.key}-${serialized.name}`;
}

export function makeStyles<K extends string>(
  stylesOrFactory: StylesObj<K> | ((theme: Theme) => StylesObj<K>),
): () => Record<K, string> {
  return function useStyles() {
    const theme = useTheme();
    return useMemo(() => {
      const stylesObj =
        typeof stylesOrFactory === 'function'
          ? stylesOrFactory(theme)
          : stylesOrFactory;

      const classes = {} as Record<K, string>;
      for (const key of Object.keys(stylesObj) as K[]) {
        classes[key] = cssClass(stylesObj[key]);
      }
      return classes;
    }, [theme]);
  };
}

export function createStyles<T extends Record<string, CSSInterpolation>>(
  styles: T,
): T {
  return styles;
}

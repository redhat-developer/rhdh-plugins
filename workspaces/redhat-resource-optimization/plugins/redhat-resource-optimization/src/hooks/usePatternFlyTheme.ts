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

import { useEffect } from 'react';
import { useTheme } from '@material-ui/core/styles';

/**
 * Hook to automatically sync Backstage theme with PatternFly dark theme.
 * Applies 'pf-v6-theme-dark' class to HTML element when Backstage is in dark mode.
 */
export const usePatternFlyTheme = () => {
  const muiTheme = useTheme();

  useEffect(() => {
    // Detect if Backstage is using dark theme
    const isDarkByType = muiTheme.palette.type === 'dark';
    const isDarkByMode = (muiTheme.palette as any).mode === 'dark';

    // Check background color for dark theme indicators
    const backgroundColor = muiTheme.palette.background?.default;
    const isDarkByBackground =
      backgroundColor &&
      (backgroundColor === '#303030' ||
        backgroundColor === '#121212' ||
        (backgroundColor.startsWith('#') &&
          parseInt(backgroundColor.slice(1), 16) < 0x808080));

    const isDark = isDarkByType || isDarkByMode || isDarkByBackground;

    // Apply PatternFly dark theme class to HTML when Backstage is in dark mode
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('pf-v6-theme-dark');
    } else {
      html.classList.remove('pf-v6-theme-dark');
    }
  }, [muiTheme]);
};

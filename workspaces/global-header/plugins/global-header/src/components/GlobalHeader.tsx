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
import { ErrorBoundary } from '@backstage/core-components';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';

import '../configureMuiClassName';
import { useGlobalHeaderComponents } from '../extensions/GlobalHeaderContext';
import { GLOBAL_HEADER_DIALOG_OFFSET_CSS } from './globalHeaderDialogOffset';

const GLOBAL_HEADER_HEIGHT_VAR = '--rhdh-global-header-height';

/**
 * Global header / masthead. Reads toolbar items from GlobalHeaderContext
 * and renders them in a sticky AppBar.
 *
 * Spans the full viewport width (PatternFly masthead / OFS Root behavior).
 * Company logo is shown by default; app shells should not hide it in favor
 * of a sidebar mark. Injected layout CSS publishes
 * `--rhdh-global-header-height` and offsets the fixed Backstage sidebar
 * drawer (and BUI dialogs) below this bar. A ResizeObserver keeps the
 * CSS variable in sync with the real masthead height.
 *
 * @public
 */
export const GlobalHeader = () => {
  const components = useGlobalHeaderComponents();

  useEffect(() => {
    const header = document.getElementById('global-header');
    if (!header) {
      return undefined;
    }

    const publishHeight = () => {
      const height = Math.round(header.getBoundingClientRect().height);
      document.documentElement.style.setProperty(
        GLOBAL_HEADER_HEIGHT_VAR,
        `${height}px`,
      );
    };

    publishHeight();

    if (typeof ResizeObserver === 'undefined') {
      return () => {
        document.documentElement.style.removeProperty(GLOBAL_HEADER_HEIGHT_VAR);
      };
    }

    const observer = new ResizeObserver(publishHeight);
    observer.observe(header);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty(GLOBAL_HEADER_HEIGHT_VAR);
    };
  }, []);

  return (
    <>
      <style data-rhdh-global-header-dialog-offset="">
        {GLOBAL_HEADER_DIALOG_OFFSET_CSS}
      </style>
      <AppBar
        position="sticky"
        component="nav"
        id="global-header"
        sx={{
          // Full viewport width — do not inset beside the sidebar.
          width: '100%',
          // Application drawer (e.g. Lightspeed) can dock from the right.
          marginRight: 'var(--docked-drawer-width, 0px)',
          transition: 'margin-right 225ms cubic-bezier(0, 0, 0.2, 1)',
        }}
      >
        <Toolbar
          sx={{
            gap: 1,
            color: theme =>
              (theme as any).rhdh?.general?.appBarForegroundColor ??
              theme.palette.text.primary,
          }}
        >
          {components.map((item, index) => (
            <ErrorBoundary key={`gh-component-${index}`}>
              <Box sx={item.layout}>
                <item.component />
              </Box>
            </ErrorBoundary>
          ))}
        </Toolbar>
      </AppBar>
    </>
  );
};

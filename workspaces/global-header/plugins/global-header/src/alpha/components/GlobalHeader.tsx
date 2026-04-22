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

import { ErrorBoundary } from '@backstage/core-components';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';

import { useGlobalHeaderComponents } from '../extensions/GlobalHeaderContext';

/**
 * Global header bar. Reads toolbar items from GlobalHeaderContext
 * and renders them in a sticky AppBar.
 *
 * @alpha
 */
export const GlobalHeader = () => {
  const components = useGlobalHeaderComponents();

  return (
    <AppBar position="sticky" component="nav" id="global-header">
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
  );
};

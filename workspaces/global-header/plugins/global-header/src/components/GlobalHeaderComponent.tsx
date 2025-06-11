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

import { ErrorBoundary } from '@backstage/core-components';

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';

import { GlobalHeaderComponentMountPoint } from '../types';

/**
 * Global Header Component properties
 * @public
 */
export interface GlobalHeaderComponentProps {
  globalHeaderMountPoints: GlobalHeaderComponentMountPoint[];
}

export const GlobalHeaderComponent = ({
  globalHeaderMountPoints,
}: GlobalHeaderComponentProps) => {
  const mountPoints = useMemo(() => {
    if (!globalHeaderMountPoints) {
      return [];
    }

    const filteredAndSorted = globalHeaderMountPoints
      .filter(component => (component.config?.priority ?? 0) > -1)
      .sort((a, b) => (b.config?.priority ?? 0) - (a.config?.priority ?? 0));

    return filteredAndSorted;
  }, [globalHeaderMountPoints]);

  return (
    <AppBar position="sticky" component="nav" id="global-header">
      <Toolbar
        sx={{
          gap: 1,
          color: theme =>
            (theme as any).rhdh?.general.appBarForegroundColor ??
            theme.palette.text.primary,
        }}
      >
        {mountPoints.map((mountPoint, index) => (
          <ErrorBoundary key={`header-component-${index}`}>
            <mountPoint.Component
              {...mountPoint.config?.props}
              layout={mountPoint.config?.layout}
            />
          </ErrorBoundary>
        ))}
      </Toolbar>
    </AppBar>
  );
};

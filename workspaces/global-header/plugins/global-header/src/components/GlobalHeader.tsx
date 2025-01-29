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

import React, { useMemo } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Divider from '@mui/material/Divider';
import { useDropdownManager } from '../hooks';
import { useGlobalHeaderMountPoints } from '../hooks/useGlobalHeaderMountPoints';
import { ComponentType, GlobalHeaderComponentMountPoint, Slot } from '../types';
import { ErrorBoundary } from '@backstage/core-components';
import { configApiRef, useApi } from '@backstage/core-plugin-api';

export const GlobalHeader = () => {
  const config = useApi(configApiRef);
  const frontendConfig = config.getOptionalConfig('dynamicPlugins.frontend');
  const frontendData = frontendConfig?.get();

  const allGlobalHeaderMountPoints = useGlobalHeaderMountPoints();

  const filteredAndSortedGlobalHeaderComponents = useMemo(() => {
    if (!allGlobalHeaderMountPoints) {
      return [];
    }

    const filteredAndSorted = allGlobalHeaderMountPoints.filter(
      component => (component.config?.priority ?? 0) > -1,
    );

    filteredAndSorted.sort(
      (a, b) => (b.config?.priority ?? 0) - (a.config?.priority ?? 0),
    );

    return filteredAndSorted;
  }, [allGlobalHeaderMountPoints]);

  const globalHeaderStartComponentsMountPoints =
    filteredAndSortedGlobalHeaderComponents.filter(
      component => component.config?.slot === Slot.HEADER_START,
    );

  const globalHeaderEndComponentsMountPoints =
    filteredAndSortedGlobalHeaderComponents.filter(
      component => component.config?.slot === Slot.HEADER_END,
    );

  const { menuStates, handleOpen, handleClose } = useDropdownManager();

  const getDropdownButtonProps = (key: string) => ({
    handleMenu: handleOpen(key),
    anchorEl: menuStates[key],
    setAnchorEl: handleClose(key),
  });

  const getIconButtonProps = (props: Record<string, any>) => ({
    icon: props.icon ?? '',
    tooltip: props.tooltip ?? '',
    to: props.to ?? '',
  });
  const renderComponents = (mountPoints: GlobalHeaderComponentMountPoint[]) =>
    mountPoints.map((mp, index) => {
      let displayHeaderIcon = false;
      if (frontendData) {
        for (const pluginData of Object.values(frontendData)) {
          const dynamicRoutes = pluginData.dynamicRoutes ?? [];
          if (
            dynamicRoutes.some(
              (route: { path: string }) => route.path === mp.config?.props?.to,
            )
          ) {
            displayHeaderIcon = true;
            break;
          }
        }
      }

      switch (mp.config?.type) {
        case ComponentType.SEARCH:
          return (
            <ErrorBoundary>
              {/* eslint-disable-next-line react/no-array-index-key */}
              <mp.Component key={index} />
            </ErrorBoundary>
          );
        case ComponentType.DROPDOWN_BUTTON:
          return (
            <ErrorBoundary>
              <mp.Component
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                {...getDropdownButtonProps(mp.config?.key ?? index.toString())}
                {...mp.config?.props}
              />
            </ErrorBoundary>
          );
        case ComponentType.ICON_BUTTON:
          return (
            <ErrorBoundary>
              {displayHeaderIcon && (
                <mp.Component
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  {...getIconButtonProps(mp.config?.props ?? {})}
                />
              )}
            </ErrorBoundary>
          );
        default:
          return null;
      }
    });

  return (
    <AppBar
      position="sticky"
      component="nav"
      sx={{ backgroundColor: '#212427' }}
    >
      <Toolbar>
        {renderComponents(globalHeaderStartComponentsMountPoints)}
        {globalHeaderStartComponentsMountPoints.length > 0 &&
          globalHeaderEndComponentsMountPoints.length > 0 && (
            <Divider
              orientation="vertical"
              flexItem
              sx={{ borderColor: '#4F5255', marginX: 1 }}
            />
          )}
        {renderComponents(globalHeaderEndComponentsMountPoints)}
      </Toolbar>
    </AppBar>
  );
};

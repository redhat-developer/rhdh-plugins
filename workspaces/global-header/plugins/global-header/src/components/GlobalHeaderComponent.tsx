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
import Divider from '@mui/material/Divider';
import Toolbar from '@mui/material/Toolbar';
import { ComponentType, GlobalHeaderComponentMountPoint, Slot } from '../types';
import { useDropdownManager } from '../hooks/useDropdownManager';
import { isExternalUrl } from '../utils/stringUtils';
import { useGlobalHeaderConfig } from '../hooks/useGlobalHeaderConfig';
import { ErrorBoundary } from '@backstage/core-components';

/**
 * @public
 * Global Header Component properties
 */
export interface GlobalHeaderComponentProps {
  globalHeaderMountPoints: GlobalHeaderComponentMountPoint[];
  supportUrl?: string;
}

export const GlobalHeaderComponent = ({
  globalHeaderMountPoints,
  supportUrl,
}: GlobalHeaderComponentProps) => {
  const { menuStates, handleOpen, handleClose } = useDropdownManager();
  const { matchesFrontendRoute, shouldDisplaySupportIcon } =
    useGlobalHeaderConfig();

  const getDropdownButtonProps = (key: string) => ({
    handleMenu: handleOpen(key),
    anchorEl: menuStates[key],
    setAnchorEl: handleClose(key),
  });

  const getIconButtonProps = (props: Record<string, any>) => {
    const buttonPros = {
      icon: props.icon ?? '',
      tooltip: props.tooltip ?? '',
      to: props.to ?? '',
    };

    if (props.icon === 'support' && buttonPros.to === '') {
      buttonPros.to = supportUrl ?? '';
    }
    return buttonPros;
  };

  const {
    globalHeaderStartComponentsMountPoints,
    globalHeaderEndComponentsMountPoints,
  } = useMemo(() => {
    if (!globalHeaderMountPoints) {
      return {
        globalHeaderStartComponentsMountPoints: [],
        globalHeaderEndComponentsMountPoints: [],
      };
    }

    const filteredAndSorted = globalHeaderMountPoints
      .filter(component => (component.config?.priority ?? 0) > -1)
      .sort((a, b) => (b.config?.priority ?? 0) - (a.config?.priority ?? 0));

    return {
      globalHeaderStartComponentsMountPoints: filteredAndSorted.filter(
        component => component.config?.slot === Slot.HEADER_START,
      ),
      globalHeaderEndComponentsMountPoints: filteredAndSorted.filter(
        component => component.config?.slot === Slot.HEADER_END,
      ),
    };
  }, [globalHeaderMountPoints]);

  const renderComponents = (mountPoints: GlobalHeaderComponentMountPoint[]) =>
    mountPoints.map((mp, index) => {
      const to = mp.config?.props?.to;
      const icon = mp.config?.props?.icon;
      const isExternal = to && isExternalUrl(to);
      const isInternalRoute = to && matchesFrontendRoute(to);
      const shouldShowSupportIcon = shouldDisplaySupportIcon(icon, to);

      const displayHeaderIcon =
        isExternal || isInternalRoute || shouldShowSupportIcon;

      const uniqueKey = `header-component-${index}`;
      switch (mp.config?.type) {
        case ComponentType.SPACER:
          return <mp.Component key={uniqueKey} />;
        case ComponentType.SEARCH:
          return (
            <ErrorBoundary key={uniqueKey}>
              <mp.Component />
            </ErrorBoundary>
          );
        case ComponentType.DROPDOWN_BUTTON:
          return (
            <ErrorBoundary key={uniqueKey}>
              <mp.Component
                {...getDropdownButtonProps(mp.config?.key ?? index.toString())}
                {...mp.config?.props}
              />
            </ErrorBoundary>
          );
        case ComponentType.ICON_BUTTON:
          return displayHeaderIcon ? (
            <ErrorBoundary key={uniqueKey}>
              <mp.Component {...getIconButtonProps(mp.config?.props ?? {})} />
            </ErrorBoundary>
          ) : null;
        default:
          return null;
      }
    });

  return (
    <AppBar position="sticky" component="nav" id="global-header">
      <Toolbar>
        {renderComponents(globalHeaderStartComponentsMountPoints)}
        {globalHeaderStartComponentsMountPoints.length > 0 &&
          globalHeaderEndComponentsMountPoints.length > 0 && (
            <Divider
              orientation="vertical"
              flexItem
              sx={{ borderColor: '#383838', marginX: 1 }}
            />
          )}
        {renderComponents(globalHeaderEndComponentsMountPoints)}
      </Toolbar>
    </AppBar>
  );
};

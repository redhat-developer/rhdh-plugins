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

import { useEffect, PropsWithChildren, useState } from 'react';
import {
  configApiRef,
  identityApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import Snackbar from '@mui/material/Snackbar';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import { useApplicationDrawerContext } from '@red-hat-developer-hub/backstage-plugin-application-drawer';
import { QuickstartDrawerContext } from './QuickstartDrawerContext';
import { QuickstartItemData } from '../types';
import { filterQuickstartItemsByRole } from '../utils';
import { useQuickstartRole } from '../hooks/useQuickstartRole';

/**
 * Provider component for the Quickstart Drawer functionality
 * @public
 */
export const QuickstartDrawerProvider = ({ children }: PropsWithChildren) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [showNotification, setShowNotification] = useState(false);
  const [hasShownNotification, setHasShownNotification] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState<number>(500);
  const [userKey, setUserKey] = useState<string>('guest');
  const identityApi = useApi(identityApiRef);
  const configApi = useApi(configApiRef);
  const { addDrawerContext } = useApplicationDrawerContext();

  // Determine role once at provider level to avoid re-fetching on drawer open/close
  const { isLoading: roleLoading, userRole } = useQuickstartRole();

  useEffect(() => {
    addDrawerContext('quickstart', {
      isDrawerOpen,
      drawerWidth,
      setDrawerWidth,
    });
  }, [addDrawerContext, drawerWidth, isDrawerOpen]);

  // Single useEffect - sets class on document.body
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.classList.add('quickstart-drawer-open');
      document.body.style.setProperty(
        '--quickstart-drawer-width',
        `${drawerWidth}px`,
      );
    } else {
      document.body.classList.remove('quickstart-drawer-open');
      document.body.style.removeProperty('--quickstart-drawer-width');
    }

    return () => {
      document.body.classList.remove('quickstart-drawer-open');
      document.body.style.removeProperty('--quickstart-drawer-width');
    };
  }, [isDrawerOpen, drawerWidth]);

  // Resolve the current user's identity to scope localStorage keys per user
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const identity = await identityApi.getBackstageIdentity();
        const ref = identity?.userEntityRef?.toLowerCase() || 'guest';
        if (!cancelled) setUserKey(ref);
      } catch (e) {
        if (!cancelled) setUserKey('guest');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [identityApi]);

  // Initialize drawer state based on per-user keys and only when quickstarts exist
  useEffect(() => {
    if (!userKey) return;

    // Determine if there are any quickstart items configured globally
    const hasAnyQuickstarts = (() => {
      try {
        if (!configApi?.has('app.quickstart')) return false;
        const items = configApi.get('app.quickstart') as unknown;
        return Array.isArray(items) && items.length > 0;
      } catch {
        return false;
      }
    })();

    const openKey = `quickstart-open:${userKey}`;
    const visitedKey = `quickstart-visited:${userKey}`;
    const notificationKey = `quickstart-notification-shown:${userKey}`;

    // If no quickstarts are configured, ensure the drawer is closed and don't mark as visited
    if (!hasAnyQuickstarts) {
      setIsDrawerOpen(false);
      // Avoid persisting visited so future addition of items can auto-open
      localStorage.setItem(openKey, 'false');
      return;
    }

    // Check if user has any eligible quickstart items
    const quickstartItems: QuickstartItemData[] = configApi?.has(
      'app.quickstart',
    )
      ? (configApi.get('app.quickstart') as QuickstartItemData[])
      : [];

    const eligibleItems =
      !roleLoading && userRole
        ? filterQuickstartItemsByRole(quickstartItems, userRole)
        : [];

    // If user has no eligible items, close the drawer and don't mark as visited
    if (!roleLoading && eligibleItems.length === 0) {
      setIsDrawerOpen(false);
      localStorage.setItem(openKey, 'false');
      return;
    }

    // Only proceed with drawer logic if user has eligible items
    const wasOpen = localStorage.getItem(openKey);
    const hasVisited = localStorage.getItem(visitedKey);
    const notificationShown = localStorage.getItem(notificationKey);

    if (!hasVisited) {
      setIsDrawerOpen(true);
      localStorage.setItem(visitedKey, 'true');
      localStorage.setItem(openKey, 'true');
    } else if (wasOpen === 'true') {
      setIsDrawerOpen(true);
    } else {
      setIsDrawerOpen(false);
    }

    setHasShownNotification(notificationShown === 'true');
  }, [userKey, configApi, roleLoading, userRole]);

  const openDrawer = () => {
    // Check if user has eligible items before opening
    const quickstartItems: QuickstartItemData[] = configApi?.has(
      'app.quickstart',
    )
      ? (configApi.get('app.quickstart') as QuickstartItemData[])
      : [];

    const eligibleItems =
      !roleLoading && userRole
        ? filterQuickstartItemsByRole(quickstartItems, userRole)
        : [];

    // Only open if user has eligible items
    if (!roleLoading && eligibleItems.length > 0) {
      setIsDrawerOpen(true);
      const openKey = `quickstart-open:${userKey}`;
      localStorage.setItem(openKey, 'true');
    }
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    if (!hasShownNotification) {
      setShowNotification(true);
      setHasShownNotification(true);
      const notificationKey = `quickstart-notification-shown:${userKey}`;
      localStorage.setItem(notificationKey, 'true');
    }
    const openKey = `quickstart-open:${userKey}`;
    localStorage.setItem(openKey, 'false');
  };

  const toggleDrawer = () => {
    const next = !isDrawerOpen;
    setIsDrawerOpen(next);
    const openKey = `quickstart-open:${userKey}`;
    localStorage.setItem(openKey, next.toString());
  };

  const handleNotificationClose = () => setShowNotification(false);

  return (
    <QuickstartDrawerContext.Provider
      value={{
        id: 'quickstart',
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        setDrawerWidth,
        drawerWidth,
        userRole,
        roleLoading,
      }}
    >
      {children}
      <Snackbar
        sx={{ top: '80px !important' }}
        open={showNotification}
        autoHideDuration={10000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        message="Need help? Visit the Quick Start Guide by clicking on this (?) icon in the header!"
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleNotificationClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </QuickstartDrawerContext.Provider>
  );
};

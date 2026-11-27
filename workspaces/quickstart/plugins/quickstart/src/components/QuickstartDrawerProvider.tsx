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
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { toastApiRef } from '@backstage/frontend-plugin-api';
import { QuickstartDrawerContext } from './QuickstartDrawerContext';
import {
  getConfiguredQuickstartItems,
  getEligibleQuickstartItems,
  postQuickstartHelpToast,
} from '../utils';
import { useQuickstartRole } from '../hooks/useQuickstartRole';
import { useQuickstartUserKey } from '../hooks/useQuickstartUserKey';
import { useTranslation } from '../hooks/useTranslation';

/**
 * Provider component for the Quickstart Drawer functionality
 * @public
 */
export const QuickstartDrawerProvider = ({ children }: PropsWithChildren) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [hasShownNotification, setHasShownNotification] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(500);
  const userKey = useQuickstartUserKey();
  const configApi = useApi(configApiRef);
  const toastApi = useApi(toastApiRef);
  const { t } = useTranslation();

  // Determine role once at provider level to avoid re-fetching on drawer open/close
  const { isLoading: roleLoading, userRole } = useQuickstartRole();

  // Initialize drawer state based on per-user keys and only when quickstarts exist
  useEffect(() => {
    if (!userKey) return;

    const openKey = `quickstart-open:${userKey}`;
    const visitedKey = `quickstart-visited:${userKey}`;
    const notificationKey = `quickstart-notification-shown:${userKey}`;
    const configuredItems = getConfiguredQuickstartItems(configApi);

    // If no quickstarts are configured, ensure the drawer is closed and don't mark as visited
    if (configuredItems.length === 0) {
      setIsDrawerOpen(false);
      // Avoid persisting visited so future addition of items can auto-open
      localStorage.setItem(openKey, 'false');
      return;
    }

    const eligibleItems = getEligibleQuickstartItems(
      configApi,
      roleLoading,
      userRole,
    );

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
    const eligibleItems = getEligibleQuickstartItems(
      configApi,
      roleLoading,
      userRole,
    );

    if (eligibleItems.length > 0) {
      setIsDrawerOpen(true);
      localStorage.setItem(`quickstart-open:${userKey}`, 'true');
    }
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    if (!hasShownNotification) {
      postQuickstartHelpToast(toastApi, t('snackbar.helpPrompt'));
      setHasShownNotification(true);
      localStorage.setItem(`quickstart-notification-shown:${userKey}`, 'true');
    }
    localStorage.setItem(`quickstart-open:${userKey}`, 'false');
  };

  const toggleDrawer = () => {
    const next = !isDrawerOpen;
    setIsDrawerOpen(next);
    localStorage.setItem(`quickstart-open:${userKey}`, next.toString());
  };

  return (
    <QuickstartDrawerContext.Provider
      value={{
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
    </QuickstartDrawerContext.Provider>
  );
};

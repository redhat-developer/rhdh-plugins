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

import { useEffect, useRef, useState } from 'react';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { toastApiRef } from '@backstage/frontend-plugin-api';
import { useAppDrawer } from '@red-hat-developer-hub/backstage-plugin-app-react';

import { useQuickstartRole } from './hooks/useQuickstartRole';
import { useQuickstartUserKey } from './hooks/useQuickstartUserKey';
import { useTranslation } from './hooks/useTranslation';
import {
  getConfiguredQuickstartItems,
  getEligibleQuickstartItems,
  postQuickstartHelpToast,
} from './utils';
import { QUICKSTART_DRAWER_ID } from './const';

/**
 * Side-effect component rendered at the app root via AppRootElementBlueprint.
 *
 * Handles first-visit auto-open of the quickstart drawer and posts a toast
 * notification when the drawer is closed for the first time.
 */
export const QuickstartInit = () => {
  const [hasShownNotification, setHasShownNotification] = useState(false);
  const initDone = useRef(false);
  const prevOpen = useRef(false);

  const userKey = useQuickstartUserKey();
  const configApi = useApi(configApiRef);
  const toastApi = useApi(toastApiRef);
  const { t } = useTranslation();
  const { isOpen, openDrawer } = useAppDrawer();
  const { isLoading: roleLoading, userRole } = useQuickstartRole();

  const drawerOpen = isOpen(QUICKSTART_DRAWER_ID);

  // Initialize drawer state based on per-user keys and eligible quickstart items
  useEffect(() => {
    if (!userKey || roleLoading || initDone.current) return;

    if (getConfiguredQuickstartItems(configApi).length === 0) return;

    const eligibleItems = getEligibleQuickstartItems(
      configApi,
      roleLoading,
      userRole,
    );
    if (eligibleItems.length === 0) return;

    const visitedKey = `quickstart-visited:${userKey}`;
    const openKey = `quickstart-open:${userKey}`;
    const notificationKey = `quickstart-notification-shown:${userKey}`;

    const hasVisited = localStorage.getItem(visitedKey);
    const wasOpen = localStorage.getItem(openKey);

    if (!hasVisited) {
      openDrawer(QUICKSTART_DRAWER_ID);
      localStorage.setItem(visitedKey, 'true');
      localStorage.setItem(openKey, 'true');
    } else if (wasOpen === 'true') {
      openDrawer(QUICKSTART_DRAWER_ID);
    }

    setHasShownNotification(localStorage.getItem(notificationKey) === 'true');
    initDone.current = true;
  }, [userKey, configApi, roleLoading, userRole, openDrawer]);

  // Track drawer close to show toast and persist state
  useEffect(() => {
    if (!initDone.current) return;

    if (prevOpen.current && !drawerOpen) {
      localStorage.setItem(`quickstart-open:${userKey}`, 'false');

      if (!hasShownNotification) {
        postQuickstartHelpToast(toastApi, t('snackbar.helpPrompt'));
        setHasShownNotification(true);
        localStorage.setItem(
          `quickstart-notification-shown:${userKey}`,
          'true',
        );
      }
    } else if (!prevOpen.current && drawerOpen) {
      localStorage.setItem(`quickstart-open:${userKey}`, 'true');
    }

    prevOpen.current = drawerOpen;
  }, [drawerOpen, userKey, hasShownNotification, toastApi, t]);

  return null;
};

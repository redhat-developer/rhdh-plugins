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
import {
  configApiRef,
  identityApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { useAppDrawer } from '@red-hat-developer-hub/backstage-plugin-app-react';
import Snackbar from '@mui/material/Snackbar';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';

import { useQuickstartRole } from '../hooks/useQuickstartRole';
import { useTranslation } from '../hooks/useTranslation';
import { QuickstartItemData } from '../types';
import { filterQuickstartItemsByRole } from '../utils';
import { QUICKSTART_DRAWER_ID } from './const';

/**
 * Side-effect component rendered at the app root via AppRootElementBlueprint.
 *
 * Handles first-visit auto-open of the quickstart drawer and shows a snackbar
 * notification when the drawer is closed for the first time.
 */
export const QuickstartInit = () => {
  const [userKey, setUserKey] = useState<string>('');
  const [showNotification, setShowNotification] = useState(false);
  const [hasShownNotification, setHasShownNotification] = useState(false);
  const initDone = useRef(false);
  const prevOpen = useRef(false);

  const identityApi = useApi(identityApiRef);
  const configApi = useApi(configApiRef);
  const { t } = useTranslation();
  const { isOpen, openDrawer } = useAppDrawer();
  const { isLoading: roleLoading, userRole } = useQuickstartRole();

  const drawerOpen = isOpen(QUICKSTART_DRAWER_ID);

  // Resolve the current user's identity to scope localStorage keys per user
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const identity = await identityApi.getBackstageIdentity();
        const ref = identity?.userEntityRef?.toLowerCase() || 'guest';
        if (!cancelled) setUserKey(ref);
      } catch {
        if (!cancelled) setUserKey('guest');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [identityApi]);

  // Initialize drawer state based on per-user keys and eligible quickstart items
  useEffect(() => {
    if (!userKey || roleLoading || initDone.current) return;

    const quickstartItems: QuickstartItemData[] = (() => {
      try {
        if (!configApi?.has('app.quickstart')) return [];
        const items = configApi.get('app.quickstart') as unknown;
        if (!Array.isArray(items)) return [];
        return items as QuickstartItemData[];
      } catch {
        return [];
      }
    })();

    if (quickstartItems.length === 0) return;

    const eligibleItems = userRole
      ? filterQuickstartItemsByRole(quickstartItems, userRole)
      : [];

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

  // Track drawer close to show snackbar and persist state
  useEffect(() => {
    if (!initDone.current) return;

    if (prevOpen.current && !drawerOpen) {
      const openKey = `quickstart-open:${userKey}`;
      localStorage.setItem(openKey, 'false');

      if (!hasShownNotification) {
        setShowNotification(true);
        setHasShownNotification(true);
        const notificationKey = `quickstart-notification-shown:${userKey}`;
        localStorage.setItem(notificationKey, 'true');
      }
    } else if (!prevOpen.current && drawerOpen) {
      const openKey = `quickstart-open:${userKey}`;
      localStorage.setItem(openKey, 'true');
    }

    prevOpen.current = drawerOpen;
  }, [drawerOpen, userKey, hasShownNotification]);

  const handleNotificationClose = () => setShowNotification(false);

  return (
    <Snackbar
      sx={{ top: '80px !important' }}
      open={showNotification}
      autoHideDuration={10000}
      onClose={handleNotificationClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      message={t('snackbar.helpPrompt')}
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
  );
};

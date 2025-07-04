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
import Snackbar from '@mui/material/Snackbar';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import { QuickstartDrawerContext } from './QuickstartDrawerContext';
import { QuickstartDrawer } from './QuickstartDrawer';
import { useQuickstartPermission } from '../hooks/useQuickstartPermission';

export const QuickstartDrawerProvider = ({ children }: PropsWithChildren) => {
  const isAllowed = useQuickstartPermission();
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [showNotification, setShowNotification] = useState(false);
  const [hasShownNotification, setHasShownNotification] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState<number>(500);

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

  useEffect(() => {
    const wasOpen = localStorage.getItem('quickstart-open');
    const hasVisited = localStorage.getItem('quickstart-visited');
    const notificationShown = localStorage.getItem(
      'quickstart-notification-shown',
    );

    if (isAllowed) {
      if (!hasVisited) {
        setIsDrawerOpen(true);
        localStorage.setItem('quickstart-visited', 'true');
      } else if (wasOpen === 'true') {
        setIsDrawerOpen(true);
      }
    }

    setHasShownNotification(notificationShown === 'true');
  }, [isAllowed]);

  const openDrawer = () => {
    setIsDrawerOpen(true);
    localStorage.setItem('quickstart-open', 'true');
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    if (!hasShownNotification) {
      setShowNotification(true);
      setHasShownNotification(true);
      localStorage.setItem('quickstart-notification-shown', 'true');
    }
    localStorage.setItem('quickstart-open', 'false');
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
    localStorage.setItem('quickstart-open', (!isDrawerOpen).toString());
  };

  const handleNotificationClose = () => setShowNotification(false);

  return (
    <QuickstartDrawerContext.Provider
      value={{
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        setDrawerWidth,
        drawerWidth,
      }}
    >
      {children}
      <QuickstartDrawer />
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

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

import { useMemo, useEffect } from 'react';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import { useTheme } from '@mui/material/styles';
import { Content, Page } from '@backstage/core-components';
import { typography, scrollbarStyles } from '../../theme/tokens';
import { sanitizeBrandingUrl } from '../../theme/branding';
import type { SecurityMode } from '../../types';
import { SecurityGate } from './SecurityGate';
import { useAppState } from './AppStateProvider';
import { AppRouter } from './AppRouter';
import './augment-isolation.css';

/**
 * AppShell provides the outermost layout frame for the Augment plugin.
 * It handles:
 * - Security gate (auth check)
 * - Global font/scrollbar/isolation styles
 * - Branding (favicon)
 * - Loading state when backend not yet ready
 * - Delegates content rendering to AppRouter
 */
export function AppShell() {
  const theme = useTheme();
  const {
    securityLoading,
    backendReady,
    configurationErrors,
    securityMode,
    branding,
    liveStatus,
    viewMode,
    isAdmin,
  } = useAppState();

  const adminScrollSx = useMemo(() => scrollbarStyles(theme), [theme]);

  useEffect(() => {
    const safeFaviconUrl = sanitizeBrandingUrl(branding.faviconUrl);
    if (!safeFaviconUrl) return undefined;

    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    const originalHref = link?.href;

    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = safeFaviconUrl;

    return () => {
      const currentLink =
        document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (currentLink && originalHref) {
        currentLink.href = originalHref;
      }
    };
  }, [branding.faviconUrl]);

  const showInitialLoading = isAdmin && viewMode === 'admin' && !liveStatus;

  return (
    <Page themeId="tool">
      <Content noPadding stretch>
        <SecurityGate
          securityLoading={securityLoading}
          backendReady={backendReady}
          configurationErrors={configurationErrors}
          securityMode={securityMode as SecurityMode | null}
          branding={branding}
        >
          <Box
            className="augment-plugin-root"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minHeight: 0,
              backgroundColor: theme.palette.background.default,
              color: theme.palette.text.primary,
              overflow: 'hidden',
              fontFamily: typography.fontFamily.primary,
              '& code, & pre, & .MuiChip-label': {
                fontFamily: typography.fontFamily.mono,
              },
            }}
          >
            {showInitialLoading ? (
              <Box
                sx={{
                  display: 'flex',
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LinearProgress sx={{ width: 200 }} />
              </Box>
            ) : (
              <AppRouter adminScrollSx={adminScrollSx} />
            )}
          </Box>
        </SecurityGate>
      </Content>
    </Page>
  );
}

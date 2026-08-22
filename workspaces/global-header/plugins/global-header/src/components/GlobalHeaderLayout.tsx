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

import { useLayoutEffect, useRef } from 'react';
import type { PropsWithChildren } from 'react';

import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';

import { GlobalHeader } from './GlobalHeader';

/**
 * CSS custom property consumed by the RHDH theme to subtract the masthead from
 * 100vh page-shell rules and offset the fixed sidebar (RHDHBUGS-3627).
 *
 * @internal
 */
export const GLOBAL_HEADER_HEIGHT_VAR = '--rhdh-global-header-height';

/**
 * Matches the legacy RHDH Root layout so theme styleOverrides for
 * `RHDHPageWithoutFixHeight` (page-inset cancellation) still apply on NFS.
 */
const PageWithoutFixHeight = styled(Box, {
  name: 'RHDHPageWithoutFixHeight',
  slot: 'root',
})({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
});

const SidebarLayout = styled(Box, {
  name: 'RHDHPageWithoutFixHeight',
  slot: 'sidebarLayout',
})({
  display: 'flex',
  flexGrow: 1,
  minHeight: 0,
  maxHeight: `calc(100vh - var(${GLOBAL_HEADER_HEIGHT_VAR}, 0px))`,
  '& div[class*="BackstageSidebarPage"]': {
    display: 'flex',
    flexDirection: 'column',
    height: 'unset',
    flexGrow: 1,
  },
  '& div[class*="BackstageSidebar-drawer"]': {
    top: `max(0px, var(${GLOBAL_HEADER_HEIGHT_VAR}, 0px))`,
  },
});

/**
 * NFS shell that keeps the global header in document flow and constrains the
 * remaining page to the viewport below it — the same contract the legacy
 * `Root` layout enforces with `aboveSidebarHeaderHeight`.
 *
 * @internal
 */
export const GlobalHeaderLayout = ({
  children,
}: PropsWithChildren<unknown>) => {
  const headerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) {
      return undefined;
    }

    const syncHeight = () => {
      const height = el.offsetHeight;
      if (height > 0) {
        document.documentElement.style.setProperty(
          GLOBAL_HEADER_HEIGHT_VAR,
          `${height}px`,
        );
      }
    };

    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(el);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty(GLOBAL_HEADER_HEIGHT_VAR);
    };
  }, []);

  return (
    <PageWithoutFixHeight>
      <Box
        id="rhdh-above-sidebar-header-container"
        ref={headerRef}
        sx={{ flexShrink: 0 }}
      >
        <GlobalHeader />
      </Box>
      <SidebarLayout id="rhdh-sidebar-layout">{children}</SidebarLayout>
    </PageWithoutFixHeight>
  );
};

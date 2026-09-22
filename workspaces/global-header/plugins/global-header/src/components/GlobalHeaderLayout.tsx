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

import type { PropsWithChildren, ReactNode } from 'react';

import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';

import { GlobalHeader } from './GlobalHeader';

/**
 * CSS custom property consumed by the RHDH theme to offset the fixed sidebar
 * and overlays below the masthead (RHDHBUGS-3627). Set statically via theme
 * CssBaseline when `#global-header` is present — not measured at runtime.
 *
 * @internal
 */
export const GLOBAL_HEADER_HEIGHT_VAR = '--rhdh-global-header-height';

/**
 * Matches the legacy RHDH Root layout so theme styleOverrides for
 * `RHDHPageWithoutFixHeight` (page-inset cancellation) still apply on NFS.
 *
 * `100vh` matches OFS `Root`: the masthead is an in-flow flex child and the
 * remaining column fills via flexbox — no ResizeObserver.
 */
const PageWithoutFixHeight = styled(Box, {
  name: 'RHDHPageWithoutFixHeight',
  slot: 'root',
})({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  maxHeight: '100vh',
  // Clip page scroll to the shell, but allow header menus to paint outside
  // this box when not portaled. Nested SidebarLayout still clips content.
  overflow: 'hidden',
  overflowX: 'clip',
  // Nested AppLayout (or a second shell) fills this parent instead of
  // adding another 100vh under the masthead.
  '& &': {
    height: '100%',
    maxHeight: '100%',
  },
  // Header row must not clip dropdowns that render as children.
  '& > #rhdh-above-sidebar-header-container': {
    overflow: 'visible',
    flexShrink: 0,
    zIndex: 1,
  },
});

const SidebarLayout = styled(Box, {
  name: 'RHDHPageWithoutFixHeight',
  slot: 'sidebarLayout',
})({
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  flexBasis: 0,
  minHeight: 0,
  overflow: 'hidden',
  '& div[class*="BackstageSidebarPage"]': {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    maxHeight: '100%',
    flexGrow: 1,
    minHeight: 0,
  },
  // Fixed sidebar must clear the in-flow masthead (Backstage defaults top:0).
  '& div[class*="BackstageSidebar-drawer"]': {
    top: `var(${GLOBAL_HEADER_HEIGHT_VAR}, 64px) !important`,
    height: `calc(100vh - var(${GLOBAL_HEADER_HEIGHT_VAR}, 64px)) !important`,
    bottom: '0 !important',
  },
});

/**
 * NFS shell that keeps the global header in document flow. The remaining
 * page fills via flexbox — the same contract the legacy `Root` layout
 * enforces with `aboveSidebarHeaderHeight`, without measuring at runtime.
 *
 * @internal
 */
export const GlobalHeaderLayout = ({
  children,
  header = <GlobalHeader />,
}: PropsWithChildren<{ header?: ReactNode }>) => {
  return (
    <PageWithoutFixHeight>
      <Box id="rhdh-above-sidebar-header-container" sx={{ flexShrink: 0 }}>
        {header}
      </Box>
      <SidebarLayout id="rhdh-sidebar-layout">{children}</SidebarLayout>
    </PageWithoutFixHeight>
  );
};

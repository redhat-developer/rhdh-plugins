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

import type { PropsWithChildren } from 'react';

import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';

/**
 * NFS app shell: viewport-tall flex column so in-flow siblings (global header)
 * take their natural height and the remaining page is `flex: 1; min-height: 0`
 * — no runtime height measurement (RHDHBUGS-3627).
 *
 * Uses `100vh` (same as legacy OFS `Root`) so the shell does not depend on a
 * percentage-height parent chain through app-root wrappers.
 *
 * Named `RHDHPageWithoutFixHeight` so existing theme styleOverrides still
 * apply when this wrapper is an ancestor of the sidebar layout.
 */
const AppLayoutRoot = styled(Box, {
  name: 'RHDHPageWithoutFixHeight',
  slot: 'root',
})({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  maxHeight: '100vh',
  overflow: 'hidden',
  // If this shell nests inside GlobalHeaderLayout (or vice versa), fill the
  // parent instead of stacking a second 100vh below the masthead.
  '& &': {
    height: '100%',
    maxHeight: '100%',
  },
});

/**
 * Viewport-filling flex column for NFS app-root wrappers.
 *
 * @internal
 */
export const AppLayout = ({ children }: PropsWithChildren) => (
  <AppLayoutRoot id="rhdh-app-layout">{children}</AppLayoutRoot>
);

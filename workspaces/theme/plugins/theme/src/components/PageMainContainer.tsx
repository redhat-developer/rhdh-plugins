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

import { PropsWithChildren } from 'react';
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';

/**
 * PatternFly-aligned main content well beside the sidebar.
 *
 * Mirrors `.pf-v6-c-page__main-container`: everything except the sidebar
 * (headers, page body, footers) should live under this wrapper so page-inset
 * rounding and scrolling apply to one surface — not the SidebarPage root.
 *
 * Use inside `SidebarPage` as a sibling of `Sidebar` / `nav`:
 *
 * ```tsx
 * <SidebarPage>
 *   <Sidebar>...</Sidebar>
 *   <PageMainContainer>{children}</PageMainContainer>
 * </SidebarPage>
 * ```
 *
 * @public
 */
const PageMainContainerRoot = styled(Box, {
  name: 'RHDHPageMainContainer',
  slot: 'root',
})(() => ({
  display: 'flex',
  flexDirection: 'column',
  flex: '1 1 auto',
  minWidth: 0,
  minHeight: 0,
}));

export const PageMainContainer = ({ children }: PropsWithChildren) => (
  <PageMainContainerRoot id="rhdh-page-main-container">
    {children}
  </PageMainContainerRoot>
);

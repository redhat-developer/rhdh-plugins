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

/**
 * Offsets the fixed Backstage sidebar below the full-width global header.
 *
 * The fixed box is `[data-testid="sidebar-root"]` (`position: fixed; top: 0;
 * bottom: 0`). Targeting only the inner drawer is not enough — the root must
 * move. 64px matches the default MUI Toolbar / masthead height.
 *
 * Injected from {@link AppSidebar} so the offset applies even when the
 * installed global-header / theme packages do not ship this CSS.
 */
export const SIDEBAR_MASTHEAD_OFFSET_CSS = `
:root:has(#global-header) {
  --rhdh-global-header-height: 64px;
}
:root:has(#global-header) [data-testid="sidebar-root"] {
  top: var(--rhdh-global-header-height, 64px) !important;
  height: calc(100vh - var(--rhdh-global-header-height, 64px)) !important;
  bottom: auto !important;
}
:root:has(#global-header) [class*="BackstageSidebar-drawer"] {
  top: 0 !important;
  height: 100% !important;
  bottom: 0 !important;
}
`;

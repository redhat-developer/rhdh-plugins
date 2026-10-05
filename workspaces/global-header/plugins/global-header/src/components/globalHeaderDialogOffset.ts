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
 * Layout offsets applied whenever `#global-header` is mounted.
 *
 * 64px fallback matches the MUI Toolbar default when
 * --rhdh-global-header-height is unset (theme may also publish the same
 * token).
 *
 * - Publishes the masthead height CSS variable for consumers.
 * - Pushes the fixed Backstage sidebar drawer below the full-width masthead
 *   (`top` + `height: 100vh - header`).
 * - Offsets BUI dialog overlays so the sticky AppBar (z-index 1100) does not
 *   cover the title/close control (RHDHBUGS-3603). Overlay z-index is raised
 *   above the AppBar default of 1000.
 *
 * A raw style tag is used instead of MUI GlobalStyles so NFS demo apps
 * and dynamic-plugin bundles pick this up without depending on a shared
 * MUI GlobalStyles export or the RHDH theme package.
 */
export const GLOBAL_HEADER_DIALOG_OFFSET_CSS = `
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
[class*="bui-DialogOverlay"] {
  top: var(--rhdh-global-header-height, 64px) !important;
  height: calc(100% - var(--rhdh-global-header-height, 64px)) !important;
  z-index: 1300;
}
[class*="bui-DialogOverlay"] > [class*="bui-Dialog"] {
  height: calc(100vh - var(--rhdh-global-header-height, 64px) - 3rem) !important;
  max-height: calc(100vh - var(--rhdh-global-header-height, 64px) - 3rem) !important;
}
`;

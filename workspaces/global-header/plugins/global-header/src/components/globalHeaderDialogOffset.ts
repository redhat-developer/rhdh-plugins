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
 * Sticky AppBar is z-index 1100. BUI Dialog overlay is 1000 and
 * InspectEntityDialog uses height 100vh, so the masthead covers the
 * title and close control (RHDHBUGS-3603).
 *
 * 64px fallback matches the MUI Toolbar default when
 * --rhdh-global-header-height is unset.
 *
 * A raw style tag is used instead of MUI GlobalStyles so NFS demo apps
 * and dynamic-plugin bundles pick this up without depending on a shared
 * MUI GlobalStyles export.
 */
export const GLOBAL_HEADER_DIALOG_OFFSET_CSS = `
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

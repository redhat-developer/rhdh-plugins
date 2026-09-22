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
 * Keep Inspect Entity / BUI dialogs below the masthead (RHDHBUGS-3603).
 *
 * BUI DialogOverlay defaults to `inset: 0` and z-index 1000. Override inset
 * so the backdrop starts under the header, and raise z-index above the page
 * while the masthead itself stays above the overlay via AppBar z-index.
 *
 * 64px fallback matches the MUI Toolbar default when
 * `--rhdh-global-header-height` is unset.
 *
 * A raw style tag is used instead of MUI GlobalStyles so NFS demo apps
 * and dynamic-plugin bundles pick this up without depending on a shared
 * MUI GlobalStyles export.
 */
export const GLOBAL_HEADER_DIALOG_OFFSET_CSS = `
[class*="bui-DialogOverlay"] {
  inset: var(--rhdh-global-header-height, 64px) 0 0 0 !important;
  top: var(--rhdh-global-header-height, 64px) !important;
  right: 0 !important;
  bottom: 0 !important;
  left: 0 !important;
  height: calc(100% - var(--rhdh-global-header-height, 64px)) !important;
  z-index: 1300;
}
[class*="bui-DialogOverlay"] > [class*="bui-Dialog"] {
  height: calc(100vh - var(--rhdh-global-header-height, 64px) - 3rem) !important;
  max-height: calc(100vh - var(--rhdh-global-header-height, 64px) - 3rem) !important;
}
`;

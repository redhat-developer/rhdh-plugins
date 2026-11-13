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

import type { ReactNode } from 'react';

/**
 * Owned marker for install/edit pages. Pass as `className` on Backstage `<Page>`
 * (renders on `<main data-backstage-core-page>`). Use with `<Content stretch>`.
 */
export const INSTALL_PAGE_CLASS = 'extensions-install-page';

const mainSelector = `main.${INSTALL_PAGE_CLASS}[data-backstage-core-page]`;

/**
 * Parent of `<main class="extensions-install-page">` is the theme SidebarPage
 * scrollport. Production JSS often hashes away `BackstageSidebarPage-root`, so
 * target via :has(> main...) instead of a class substring.
 */
const scrollportSelector = `*:has(> ${mainSelector})`;

export const installPageFillStyle = `
/*
 * Defense in depth for older themes that still key PluginHeader hiding on
 * [class*='BackstagePage-root'] (stripped by production JSS). A visible
 * PluginHeader + main { height:100% } overflows the SidebarPage scrollport →
 * outer scrollbar + inner card scrollbar, and the install/cancel bar is not
 * reachable without redundant scrolling. Newer themes hide via
 * main[data-backstage-core-page]; keep this so the extensions plugin works
 * against either. overflow-y:hidden keeps this fill layout as the sole
 * scroll owner (cards scroll internally; action bar stays in view).
 */
${scrollportSelector} > .bui-PluginHeader {
  display: none !important;
}
${scrollportSelector} {
  overflow-y: hidden !important;
}
${mainSelector} {
  height: 100% !important;
  max-height: 100% !important;
  min-height: 0 !important;
  box-sizing: border-box;
  overflow: hidden !important;
  overflow-y: hidden !important;
  /*
   * Backstage Page uses gridTemplateRows: max-content auto 1fr. Bare 1fr is
   * minmax(auto, 1fr), so the content row will not shrink below Monaco's
   * min-content and the action bar is clipped by overflow:hidden.
   */
  grid-template-rows: max-content auto minmax(0, 1fr) !important;
}
${mainSelector} > article {
  display: flex !important;
  flex-direction: column !important;
  box-sizing: border-box !important;
  height: 100% !important;
  max-height: 100% !important;
  min-height: 0 !important;
  overflow: hidden !important;
}
${mainSelector} > article > * {
  flex: 1 1 0 !important;
  min-height: 0 !important;
  min-width: 0;
}
`;

/** Injects shell-fill styles so Monaco and the action bar can lay out. */
export const InstallPageFill = ({ children }: { children: ReactNode }) => (
  <>
    <style>{installPageFillStyle}</style>
    {children}
  </>
);

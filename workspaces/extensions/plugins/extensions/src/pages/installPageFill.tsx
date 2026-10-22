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

export const installPageFillStyle = `
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

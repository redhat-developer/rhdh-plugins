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

import { render } from '@testing-library/react';

import {
  INSTALL_PAGE_CLASS,
  InstallPageFill,
  installPageFillStyle,
} from './installPageFill';

describe('installPageFill', () => {
  it('marks install pages with a stable class for shell-fill targeting', () => {
    expect(INSTALL_PAGE_CLASS).toBe('extensions-install-page');
  });

  it('hides BUI PluginHeader and disables the SidebarPage outer scrollbar', () => {
    expect(installPageFillStyle).toContain('.bui-PluginHeader');
    expect(installPageFillStyle).toContain('display: none !important');
    expect(installPageFillStyle).toContain('overflow-y: hidden !important');
    expect(installPageFillStyle).toContain(
      `main.${INSTALL_PAGE_CLASS}[data-backstage-core-page]`,
    );
    expect(installPageFillStyle).toContain(
      'grid-template-rows: max-content auto minmax(0, 1fr) !important',
    );
  });

  it('injects the fill styles into the document', () => {
    const { container } = render(
      <InstallPageFill>
        <div>content</div>
      </InstallPageFill>,
    );
    const style = container.querySelector('style');
    expect(style?.textContent).toContain(INSTALL_PAGE_CLASS);
    expect(style?.textContent).toContain('.bui-PluginHeader');
  });
});

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

describe('index entrypoint', () => {
  const fontStyleSelector = 'style[data-rhdh-fonts="redhat"]';

  beforeEach(() => {
    document.querySelector(fontStyleSelector)?.remove();
    jest.resetModules();
  });

  afterEach(() => {
    document.querySelector(fontStyleSelector)?.remove();
  });

  it('injects Red Hat @font-face rules when loaded', async () => {
    expect(document.querySelector(fontStyleSelector)).toBeNull();

    await import('./index');

    const style = document.querySelector(fontStyleSelector);
    expect(style).toBeTruthy();
    expect(style?.textContent).toContain("@font-face{font-family:'RedHatText'");
  });
});

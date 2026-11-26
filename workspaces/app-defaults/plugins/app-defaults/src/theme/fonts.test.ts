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

import { injectRedHatFontFaces, redHatFontFaces, redHatFonts } from './fonts';

describe('fonts', () => {
  const fontStyleSelector = 'style[data-rhdh-fonts="redhat"]';

  afterEach(() => {
    document.querySelector(fontStyleSelector)?.remove();
  });

  it('exports Red Hat font face and font family definitions', () => {
    expect(redHatFontFaces).toHaveLength(6);
    expect(redHatFonts.text).toContain('RedHatText');
    expect(redHatFonts.heading).toContain('RedHatDisplay');
    expect(redHatFonts.monospace).toContain('RedHatMono');
  });

  it('injects a single style tag with @font-face rules', () => {
    injectRedHatFontFaces();

    const style = document.querySelector(fontStyleSelector);
    expect(style).toBeTruthy();
    expect(style?.textContent).toContain(
      "@font-face{font-family:'RedHatDisplay'",
    );
    expect(style?.textContent).toContain("@font-face{font-family:'RedHatText'");
    expect(style?.textContent).toContain("@font-face{font-family:'RedHatMono'");
    expect(style?.textContent).toContain("format('woff2-variations')");
  });

  it('is idempotent when called more than once', () => {
    injectRedHatFontFaces();
    injectRedHatFontFaces();

    expect(document.querySelectorAll(fontStyleSelector)).toHaveLength(1);
  });
});

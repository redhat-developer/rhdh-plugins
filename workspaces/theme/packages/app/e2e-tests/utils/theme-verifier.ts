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
import { Page, expect, TestInfo } from '@playwright/test';

export class ThemeVerifier {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  private readonly themeVerifierElements = {
    MuiTypographyColorPrimary: '.MuiTypography-colorPrimary',
    MuiSwitchColorPrimary: '.MuiSwitch-colorPrimary',
    MuiButtonTextPrimary: '.MuiButton-textPrimary',
  };

  async setTheme(theme: string) {
    const settingsLink = this.page
      .getByTestId('sidebar-root')
      .getByRole('link', { name: 'Settings' });

    await settingsLink.click();
    await expect(
      this.page.locator('nav').getByText('Settings').first(),
    ).toBeVisible();
    await this.page.getByRole('button', { name: theme, exact: true }).click();
    const themeButton = this.page.getByRole('button', {
      name: theme,
      exact: true,
    });

    // TODO: https://issues.redhat.com/browse/RHDHBUGS-2076 navigating back to settings page is needed until the issue is resolved
    await settingsLink.click();

    await expect(themeButton).toHaveAttribute('aria-pressed', 'true');
  }

  async checkCssColor(page: Page, selector: string, expectedColor: string) {
    const elements = page.locator(selector);
    const count = await elements.count();

    for (let i = 0; i < count; i++) {
      const color = await elements
        .nth(i)
        .evaluate(el => window.getComputedStyle(el).color);
      expect(color).toBe(expectedColor);
    }
  }

  async verifyPrimaryColors(colorPrimary: string) {
    await this.checkCssColor(
      this.page,
      this.themeVerifierElements.MuiTypographyColorPrimary,
      colorPrimary,
    );
    await this.checkCssColor(
      this.page,
      this.themeVerifierElements.MuiSwitchColorPrimary,
      colorPrimary,
    );
    await this.page.locator('a').filter({ hasText: 'APIs' }).click();
    await this.checkCssColor(
      this.page,
      this.themeVerifierElements.MuiButtonTextPrimary,
      colorPrimary,
    );
  }

  async takeScreenshotAndAttach(
    screenshotPath: string,
    testInfo: TestInfo,
    description: string,
  ) {
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    await testInfo.attach(description, { path: screenshotPath });
  }

  /**
   * Asserts Red Hat @font-face rules were injected with webpack-resolved woff2
   * URLs (not relative paths from published font.min.css styleInject).
   */
  async verifyRedHatFontsInjected() {
    const fontStyle = this.page.locator('style[data-rhdh-fonts="redhat"]');
    await expect(fontStyle).toHaveCount(1);

    const css = await fontStyle.textContent();
    expect(css).toBeTruthy();

    for (const fontFamily of ['RedHatDisplay', 'RedHatText', 'RedHatMono']) {
      expect(css).toContain(`@font-face{font-family:'${fontFamily}'`);
    }

    expect(css).toMatch(/url\([^)]+\.woff2\)\s+format\('woff2-variations'\)/);
    // Relative styleInject paths break under app publicPath.
    expect(css).not.toMatch(/url\(\s*['"]?\.\//);
  }
}

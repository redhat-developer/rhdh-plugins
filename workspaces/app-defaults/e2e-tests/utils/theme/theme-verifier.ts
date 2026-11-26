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

  /**
   * Match MUI class names with or without a ClassNameGenerator prefix (e.g. v5-).
   */
  private readonly themeVerifierElements = {
    MuiTypographyColorPrimary: '[class*="MuiTypography-colorPrimary"]',
    MuiSwitchColorPrimary: '[class*="MuiSwitch-colorPrimary"]',
  };

  async openSettings() {
    // Sidebar Settings is hidden when the global header is present.
    await this.page.getByRole('button', { name: 'Settings' }).click();
    await this.page.getByRole('menuitem', { name: 'Settings' }).click();
    await expect(
      this.page.getByRole('heading', { name: 'Settings' }).first(),
    ).toBeVisible();
  }

  async setTheme(theme: string) {
    await this.openSettings();
    await this.page.getByRole('button', { name: theme, exact: true }).click();
    const themeButton = this.page.getByRole('button', {
      name: theme,
      exact: true,
    });

    // TODO: https://issues.redhat.com/browse/RHDHBUGS-2076 navigating back to settings page is needed until the issue is resolved
    await this.openSettings();

    await expect(themeButton).toHaveAttribute('aria-pressed', 'true');
  }

  async checkCssColor(page: Page, selector: string, expectedColor: string) {
    const elements = page.locator(selector);
    const count = await elements.count();
    expect(
      count,
      `Expected at least one element matching ${selector}`,
    ).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const color = await elements
        .nth(i)
        .evaluate(el => window.getComputedStyle(el).color);
      expect(color).toBe(expectedColor);
    }
  }

  async verifyPrimaryColors(colorPrimary: string) {
    // Settings (Appearance) exposes MUI primary typography + switches.
    // Catalog/API empty states use BUI ButtonLink, not MuiButton-textPrimary.
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

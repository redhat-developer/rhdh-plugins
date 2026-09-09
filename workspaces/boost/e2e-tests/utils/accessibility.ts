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

import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, type TestInfo } from '@playwright/test';

/**
 * Upstream library false positives that cannot be fixed in the boost plugin:
 * - nested-interactive: @backstage/ui / React Aria combobox and select triggers
 *   nest focusable controls inside interactive parents (same as global-header).
 *
 * Tracked in https://redhat.atlassian.net/browse/RHDHBUGS-3738 — remove this
 * suppression once the AI Catalog UI violations are fixed (including
 * color-contrast on category badges when the catalog has assets).
 */
// Intentional divergence from other workspace copies: callers can override via
// options.disableRules; default suppression is tied to RHDHBUGS-3738.
const DEFAULT_AXE_DISABLE_RULES = ['nested-interactive'] as const;

export async function runAccessibilityTests(
  page: Page,
  testInfo: TestInfo,
  attachName = 'accessibility-scan-results.json',
  options?: {
    disableRules?: string[];
  },
) {
  const disableRules = options?.disableRules ?? [...DEFAULT_AXE_DISABLE_RULES];

  let axeBuilder = new AxeBuilder({ page }).withTags([
    'wcag2a',
    'wcag2aa',
    'wcag21a',
    'wcag21aa',
  ]);
  if (disableRules.length) {
    axeBuilder = axeBuilder.disableRules(disableRules);
  }

  const accessibilityScanResults = await axeBuilder.analyze();

  await testInfo.attach(attachName, {
    body: JSON.stringify(accessibilityScanResults, null, 2),
    contentType: 'application/json',
  });

  expect(
    accessibilityScanResults.violations,
    'Accessibility violations found',
  ).toEqual([]);
}

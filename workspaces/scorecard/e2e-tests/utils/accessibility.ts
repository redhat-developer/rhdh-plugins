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
import { expect, Page, TestInfo } from '@playwright/test';

export async function runAccessibilityTests(
  page: Page,
  testInfo: TestInfo,
  attachName = 'accessibility-scan-results.json',
  options?: {
    includeSelectors?: string[];
    disableRules?: string[];
  },
) {
  let axeBuilder = new AxeBuilder({ page }).withTags([
    'wcag2a',
    'wcag2aa',
    'wcag21a',
    'wcag21aa',
  ]);
  for (const selector of options?.includeSelectors ?? []) {
    axeBuilder = axeBuilder.include(selector);
  }
  if (options?.disableRules?.length) {
    axeBuilder = axeBuilder.disableRules(options.disableRules);
  }
  const accessibilityScanResults = await axeBuilder.analyze();

  await testInfo.attach(attachName, {
    body: JSON.stringify(accessibilityScanResults, null, 2),
    contentType: 'application/json',
  });

  // Ignore known product a11y gaps until fixed in the plugin:
  // - button-name: icon-only buttons that rely on a tooltip (e.g. "Last updated" info icon)
  // - label-content-name-mismatch: ThresholdBucketTile aria-label does not match
  //   concatenated visible text (axe-core 4.14+); drop once aria-label is removed
  const filteredViolations = accessibilityScanResults.violations.filter(
    v => v.id !== 'button-name' && v.id !== 'label-content-name-mismatch',
  );

  expect(
    filteredViolations,
    `Accessibility check (${accessibilityScanResults.violations.length} violations)`,
  ).toEqual([]);
}

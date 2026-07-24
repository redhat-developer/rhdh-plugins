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

/**
 * Upstream library false positives that cannot be fixed in the theme plugin:
 * - aria-valid-attr-value: @backstage/ui / react-aria use React useId() IDs
 *   containing ":" in aria-controls (axe rejects colon IDREFs).
 * - nested-interactive: @material-table/core nests focusable controls inside
 *   MuiTableSortLabel (role=button). Demo also sets options.draggable=false.
 */
const UPSTREAM_AXE_DISABLE_RULES = [
  'aria-valid-attr-value',
  'nested-interactive',
] as const;

export async function runAccessibilityTests(
  page: Page,
  testInfo: TestInfo,
  attachName = 'accessibility-scan-results.json',
  options: { skipViolationsAssert?: boolean; attachName?: string } = {
    skipViolationsAssert: false,
  },
) {
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .disableRules([...UPSTREAM_AXE_DISABLE_RULES])
    .analyze();

  await testInfo.attach(attachName, {
    body: JSON.stringify(accessibilityScanResults, null, 2),
    contentType: 'application/json',
  });

  if (!options?.skipViolationsAssert) {
    expect(
      accessibilityScanResults.violations,
      'Accessibility violations found',
    ).toEqual([]);
  }
}

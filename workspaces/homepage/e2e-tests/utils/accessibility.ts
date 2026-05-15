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
 * Rule IDs to ignore when APP_MODE is 'nfs'. Used for known issues in the NFS
 * app (e.g. list structure in third-party or shared components).
 */
const NFS_IGNORED_VIOLATION_IDS = ['list'];

function getFilteredViolations(
  violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations'],
): Awaited<ReturnType<AxeBuilder['analyze']>>['violations'] {
  if (process.env.APP_MODE !== 'nfs') {
    return violations;
  }
  return violations.filter(v => !NFS_IGNORED_VIOLATION_IDS.includes(v.id));
}

export async function runAccessibilityTests(
  page: Page,
  testInfo: TestInfo,
  attachName = 'accessibility-scan-results.json',
) {
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  await testInfo.attach(attachName, {
    body: JSON.stringify(accessibilityScanResults, null, 2),
    contentType: 'application/json',
  });

  const violationsToAssert = getFilteredViolations(
    accessibilityScanResults.violations,
  );
  expect(violationsToAssert, 'Accessibility violations found').toEqual([]);
}

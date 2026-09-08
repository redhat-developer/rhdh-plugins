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

import { test, expect } from '@playwright/test';

async function signInAsGuest(page: import('@playwright/test').Page) {
  await page.goto('/');
  const enterButton = page.getByRole('button', { name: 'Enter' });
  await expect(enterButton).toBeVisible();
  await enterButton.click();
  await expect(page).toHaveURL(/\/home/);
}

async function gotoAiResourceCatalog(page: import('@playwright/test').Page) {
  await page.goto('/catalog?filters[kind]=airesource&filters[user]=all');
}

test.describe('AiResource catalog QE (RHIDP-14382)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsGuest(page);
  });

  test('catalog lists git-backed AiResource entities', async ({ page }) => {
    await gotoAiResourceCatalog(page);

    await expect(
      page.getByRole('link', { name: 'fraud-detection-model' }),
    ).toBeVisible();
  });

  test('catalog lists OCI-backed AiResource entities', async ({ page }) => {
    await gotoAiResourceCatalog(page);

    await expect(
      page.getByRole('link', { name: 'summarization-skills' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'PDF Processor Skill' }),
    ).toBeVisible();
  });

  test('git-backed AiResource entity detail page renders metadata', async ({
    page,
  }) => {
    await page.goto('/catalog/default/airesource/fraud-detection-model');

    await expect(
      page.getByText('Fraud detection model trained on transaction data.'),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'ML Platform' }).first(),
    ).toBeVisible();
  });

  test('OCI-backed AiResource entity detail page renders metadata', async ({
    page,
  }) => {
    await page.goto('/catalog/default/airesource/summarization-skills');

    await expect(
      page.getByText(
        'Summarization prompt and skill pack published as an OCI artifact.',
      ),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'ML Platform' }).first(),
    ).toBeVisible();
  });

  test('AiResource entity with techdocs-ref shows Docs tab', async ({
    page,
  }) => {
    await page.goto('/catalog/default/airesource/code-review-skill-oci');

    await expect(
      page.getByRole('heading', { name: 'Code Review Skill (OCI)' }),
    ).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Docs' })).toBeVisible();
  });

  test('AiResource entity without techdocs-ref hides Docs tab', async ({
    page,
  }) => {
    await page.goto('/catalog/default/airesource/summarization-skills-pack');

    await expect(page.getByRole('tab', { name: 'Docs' })).toHaveCount(0);
  });

  test('global search finds AiResource entities by name', async ({ page }) => {
    await page.goto('/search?query=fraud-detection');

    await expect(
      page.getByRole('link', { name: 'fraud-detection-model' }),
    ).toBeVisible();
  });
});

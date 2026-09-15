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

test.describe('AiResource catalog QE (RHIDP-14382 / RHIDP-14746)', () => {
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
    await expect(page.getByText('Lifecycle')).toBeVisible();
    await expect(page.getByText('production', { exact: true })).toBeVisible();
    await expect(page.getByText('Type')).toBeVisible();
    await expect(page.getByText('model', { exact: true })).toBeVisible();
  });

  test('OCI-backed AiResource entity detail page renders metadata', async ({
    page,
  }) => {
    await page.goto('/catalog/default/airesource/pdf-processor-skill');

    await expect(
      page.getByRole('heading', { name: 'PDF Processor Skill' }),
    ).toBeVisible();
    await expect(
      page.getByText(
        'OCI-published skill that extracts and summarizes PDF documents.',
      ),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'ML Platform' }).first(),
    ).toBeVisible();
    await expect(page.getByText('Lifecycle')).toBeVisible();
    await expect(page.getByText('experimental', { exact: true })).toBeVisible();
    await expect(page.getByText('skill', { exact: true })).toBeVisible();
    await expect(page.getByText('pdf', { exact: true })).toBeVisible();
  });

  test('OCI summarization-skills entity detail page renders metadata', async ({
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

  test('AiResource entity without techdocs-ref renders overview', async ({
    page,
  }) => {
    await page.goto('/catalog/default/airesource/summarization-skills-pack');

    await expect(
      page.getByRole('heading', { name: 'Summarization Skills Pack' }),
    ).toBeVisible();
    await expect(
      page.getByText(
        'Bundle of summarization prompts/skills published as one OCI artifact.',
      ),
    ).toBeVisible();
  });

  test('global search finds OCI-backed AiResource entities by name', async ({
    page,
  }) => {
    await page.goto('/search?query=pdf-processor');

    await expect(
      page.getByRole('link', { name: 'PDF Processor Skill' }),
    ).toBeVisible();
  });

  test('global search finds AiResource entities by name', async ({ page }) => {
    await page.goto('/search?query=fraud-detection');

    await expect(
      page.getByRole('link', { name: 'fraud-detection-model' }),
    ).toBeVisible();
  });
});

// Product gaps — tracked for dev, not QE-fixable in tests alone.
test.describe('AiResource entity page gaps (blocked on product)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsGuest(page);
  });

  test.fixme(
    'AiResource without techdocs-ref hides Docs tab (openspec 4.4)',
    async ({ page }) => {
      await page.goto('/catalog/default/airesource/summarization-skills-pack');

      await expect(page.getByRole('tab', { name: 'Docs' })).toHaveCount(0);
    },
  );

  test.fixme(
    'git-backed AiResource shows clickable source-location link (openspec 4.2)',
    async ({ page }) => {
      await page.goto('/catalog/default/airesource/fraud-detection-model');

      await expect(
        page.getByRole('link', {
          name: /github\.com\/my-org\/fraud-detection/,
        }),
      ).toBeVisible();
    },
  );

  test.fixme(
    'OCI-backed AiResource shows copyable OCI source-location (openspec 4.2)',
    async ({ page }) => {
      await page.goto('/catalog/default/airesource/summarization-skills');

      await expect(
        page.getByText('oci://quay.io/my-org/summarization-skills:latest'),
      ).toBeVisible();
    },
  );
});

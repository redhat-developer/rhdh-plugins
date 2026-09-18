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
import { runAccessibilityTests } from './utils/accessibility';
import { skipUnlessLocales } from './utils/localeSkip';
import { AiExperienceMessages, getTranslations } from './utils/translations';
import {
  expectAboutCardField,
  gotoAiResourceCatalog,
  signInAsGuest,
  switchToLocale,
} from './utils/testHelper';

test.describe('AiResource catalog QE (RHIDP-14382 / RHIDP-14746)', () => {
  let translations: AiExperienceMessages;

  test.beforeEach(async ({ page }, testInfo) => {
    const projectLocale =
      typeof testInfo.project.use.locale === 'string'
        ? testInfo.project.use.locale.split('-')[0]
        : 'en';
    translations = getTranslations(projectLocale);

    await signInAsGuest(page);
    await switchToLocale(page, projectLocale);
  });

  test('AI Experience home renders translated content', async ({ page }) => {
    await page.goto('/home');

    await expect(
      page.getByText(translations.learn.getStarted.title, { exact: true }),
    ).toBeVisible();
    await expect(
      page
        .getByRole('heading', { name: translations.sections.exploreAiModels })
        .first(),
    ).toBeVisible();
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
    await expectAboutCardField(page, 'Lifecycle', 'production');
    await expectAboutCardField(page, 'Type', 'model');
    await expect(page.getByText('Relations', { exact: true })).toBeVisible();
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
    await expectAboutCardField(page, 'Lifecycle', 'experimental');
    await expectAboutCardField(page, 'Type', 'skill');
    await expectAboutCardField(page, 'Tags', 'pdf');
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

  // Entity page always renders Docs today; fails until conditional routing lands.
  test.fail(
    'AiResource entity without techdocs-ref hides Docs tab',
    async ({ page }) => {
      await page.goto('/catalog/default/airesource/summarization-skills-pack');

      await expect(
        page.getByRole('heading', { name: 'Summarization Skills Pack' }),
      ).toBeVisible();
      await expect(
        page.getByText(
          'Bundle of summarization prompts/skills published as one OCI artifact.',
        ),
      ).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Docs' })).not.toBeVisible();
    },
  );

  test('global search finds AiResource entities by name', async ({ page }) => {
    await page.goto('/search?query=fraud-detection');
    await expect(
      page.getByRole('link', { name: 'fraud-detection-model' }),
    ).toBeVisible();

    await page.goto('/search?query=pdf-processor');
    await expect(
      page.getByRole('link', { name: 'PDF Processor Skill' }),
    ).toBeVisible();
  });
});

test.describe('AiResource catalog accessibility', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    skipUnlessLocales(testInfo, ['en'], 'Accessibility scans run on en only');
    await signInAsGuest(page);
  });

  test('catalog index passes accessibility scan', async ({
    page,
  }, testInfo) => {
    await gotoAiResourceCatalog(page);
    await runAccessibilityTests(
      page,
      testInfo,
      'airesource-catalog-index-a11y.json',
    );
  });

  test('entity detail page passes accessibility scan', async ({
    page,
  }, testInfo) => {
    await page.goto('/catalog/default/airesource/fraud-detection-model');
    await runAccessibilityTests(
      page,
      testInfo,
      'airesource-entity-detail-a11y.json',
    );
  });
});

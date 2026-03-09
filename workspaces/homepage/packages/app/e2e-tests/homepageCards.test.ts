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

import { test, expect, BrowserContext, Page } from '@playwright/test';
import { TestUtils } from './utils/testUtils.js';
import {
  HomepageMessages,
  evaluateMessage,
  getTranslations,
} from './utils/translations.js';

test.describe('Homepage Card Individual Tests', () => {
  let testUtils: TestUtils;
  let sharedPage: Page;
  let sharedContext: BrowserContext;
  let translations: HomepageMessages;

  test.beforeAll(async ({ browser }) => {
    sharedContext = await browser.newContext();
    sharedPage = await sharedContext.newPage();
    testUtils = new TestUtils(sharedPage);
    const currentLocale = await sharedPage.evaluate(
      () => globalThis.navigator.language,
    );
    await testUtils.loginAsGuest();
    await testUtils.switchToLocale(currentLocale);
    translations = getTranslations(currentLocale);
  });

  test.afterAll(async () => {
    await sharedContext.close();
  });

  test('Verify Onboarding Card Content and Links', async () => {
    const greetingRegex = new RegExp(
      `(${translations.onboarding.greeting.goodMorning}|${translations.onboarding.greeting.goodAfternoon}|${translations.onboarding.greeting.goodEvening})`,
    );
    const greetingHeading = sharedPage.getByText(greetingRegex);
    await expect(greetingHeading).toBeVisible();

    const actualHeadingText = await greetingHeading.textContent();
    const greetingPart = actualHeadingText
      ? actualHeadingText.split(',')[0].trim()
      : translations.onboarding.greeting.goodMorning;

    // Single-word greetings use full word, multi-word use first word
    const cardHeading = greetingPart.includes(' ')
      ? greetingPart.split(' ')[0]
      : greetingPart;

    await testUtils.verifyTextInCard(
      cardHeading,
      translations.onboarding.getStarted.title,
    );
    await testUtils.verifyTextInCard(
      cardHeading,
      translations.onboarding.getStarted.description,
    );
    await testUtils.verifyLinkInCard(
      cardHeading,
      translations.onboarding.getStarted.buttonText,
      false,
    );
    await testUtils.verifyLinkURLInCard(
      cardHeading,
      translations.onboarding.getStarted.buttonText,
      'docs.redhat.com',
      false,
    );

    await testUtils.verifyTextInCard(
      cardHeading,
      translations.onboarding.explore.title,
    );
    await testUtils.verifyTextInCard(
      cardHeading,
      translations.onboarding.explore.description,
    );
    await testUtils.verifyLinkInCard(
      cardHeading,
      translations.onboarding.explore.buttonText,
      false,
    );
    await testUtils.verifyLinkURLInCard(
      cardHeading,
      translations.onboarding.explore.buttonText,
      '/catalog',
      false,
    );

    await testUtils.verifyTextInCard(
      cardHeading,
      translations.onboarding.learn.title,
    );
    await testUtils.verifyTextInCard(
      cardHeading,
      translations.onboarding.learn.description,
    );
    await testUtils.verifyLinkInCard(
      cardHeading,
      translations.onboarding.learn.buttonText,
      false,
    );
    await testUtils.verifyLinkURLInCard(
      cardHeading,
      translations.onboarding.learn.buttonText,
      '/learning-paths',
      false,
    );
  });

  test('Verify Quick Access Card Content and Error State', async () => {
    await testUtils.verifyText(translations.quickAccess.title);

    await testUtils.verifyTextInCard(
      translations.quickAccess.title,
      translations.quickAccess.fetchError,
      false,
    );
  });

  test('Verify Entities Card Content and Links', async () => {
    await testUtils.verifyText(translations.entities.title);

    await testUtils.verifyTextInCard(
      translations.entities.title,
      translations.entities.description,
    );

    await testUtils.verifyLinkInCard(
      translations.entities.title,
      evaluateMessage(translations.entities.viewAll, '5'),
    );
  });

  test('Verify Templates Card Content and Links', async () => {
    await testUtils.verifyText(translations.templates.title);

    await testUtils.verifyTextInCard(
      translations.templates.title,
      translations.templates.empty,
    );
    await testUtils.verifyTextInCard(
      translations.templates.title,
      translations.templates.emptyDescription,
    );

    await testUtils.verifyLinkInCard(
      translations.templates.title,
      translations.templates.register,
    );
    await testUtils.verifyLinkURLInCard(
      translations.templates.title,
      translations.templates.register,
      '/catalog-import',
    );
  });
});

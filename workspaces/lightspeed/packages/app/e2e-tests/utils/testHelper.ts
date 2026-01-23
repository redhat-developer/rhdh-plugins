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

import { Page, expect } from '@playwright/test';
import { mockFeedbackReceived } from './devMode';
import { LightspeedMessages } from './translations';

/**
 * Mapping of locale codes to their native display names
 */
const LOCALE_DISPLAY_NAMES: Record<string, string> = {
  en: 'English',
  fr: 'Français',
  it: 'Italiano',
  ja: '日本語',
};

/**
 * Get the display name for a locale code
 */
export function getLocaleDisplayName(locale: string): string {
  const baseLocale = locale.split('-')[0];
  return LOCALE_DISPLAY_NAMES[baseLocale] || locale;
}

export const switchToLocale = async (page: Page, locale: string) => {
  const baseLocale = locale.split('-')[0];
  if (baseLocale === 'en') return;

  const displayName = getLocaleDisplayName(locale);
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'English' }).click();
  await page.getByRole('option', { name: displayName }).click();
  await page.locator('a').filter({ hasText: 'Home' }).click();
};

export const openLightspeed = async (page: Page) => {
  await page.goto('/lightspeed');
  await page.locator('.pf-chatbot__messagebox').waitFor({ state: 'visible' });
};

export const sendMessage = async (
  message: string,
  page: Page,
  translations: LightspeedMessages,
  waitForResponse = true,
) => {
  const inputLocator = page.getByRole('textbox', {
    name: translations['chatbox.message.placeholder'],
  });
  await inputLocator.fill(message);
  const sendButton = page.getByRole('button', { name: 'Send' });
  await sendButton.click();
  if (waitForResponse) {
    await page
      .locator('.pf-chatbot__message-loading')
      .waitFor({ state: 'hidden', timeout: 60000 });
  }
};

export async function verifyFeedbackButtons(page: Page) {
  const expectedButtons = ['Good response', 'Bad response', 'Copy', 'Listen'];
  const responseActions = page.locator('.pf-chatbot__response-actions');
  await expect(responseActions).toBeVisible();

  for (const name of expectedButtons) {
    const button = responseActions.getByRole('button', { name });
    await expect(button).toBeVisible();
  }
}

export async function submitFeedback(
  page: Page,
  ratingButtonName: string,
  devMode: boolean,
  translations: LightspeedMessages,
) {
  // Click the Good/Bad response button
  await page.getByRole('button', { name: ratingButtonName }).click();

  const feedbackCard = page.getByLabel(translations['feedback.form.title']);
  await expect(feedbackCard).toBeVisible();

  const optionalFeedback = feedbackCard.getByPlaceholder(
    translations['feedback.form.textAreaPlaceholder'],
  );
  await expect(optionalFeedback).toBeVisible();

  const quickFeedbackLabels = feedbackCard.locator('li');
  const quickFeedbackLabelsCount = await quickFeedbackLabels.count();

  expect(quickFeedbackLabelsCount).toEqual(3);

  await quickFeedbackLabels.first().click();

  if (devMode) {
    // Mock API response for v1/feedback
    await mockFeedbackReceived(page);
  }

  await feedbackCard
    .getByRole('button', { name: translations['feedback.form.submitWord'] })
    .click();

  const feedbackConfirmationPanel = page.getByLabel(
    translations['feedback.completion.title'],
  );
  await expect(feedbackConfirmationPanel).toBeVisible();
  await expect(feedbackConfirmationPanel).toContainText(
    translations['feedback.completion.body'],
  );
  await feedbackConfirmationPanel.waitFor({ state: 'hidden' });
  // missing translation
  await page.getByRole('button', { name: 'Response recorded' }).hover();
  const tooltipMsg = page.getByRole('tooltip', { name: 'Response recorded' });
  await expect(tooltipMsg).toBeVisible();
}

export async function assertClipboardContains(
  page: Page,
  expectedText: string,
) {
  const clipboardText = await page.evaluate(() =>
    window.navigator.clipboard.readText(),
  );
  expect(clipboardText).toMatch(expectedText);
}

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

export const openLightspeed = async (page: Page) => {
  const navLink = page.getByRole('link', { name: 'Lightspeed' });
  await navLink.click();

  await page.locator('.pf-chatbot__messagebox').waitFor({ state: 'visible' });
};

export const sendMessage = async (message: string, page: Page) => {
  const inputLocator = page.getByRole('textbox', {
    name: 'Send a message and optionally upload a JSON, YAML, TXT, or XML file...',
  });
  await inputLocator.fill(message);
  const sendButton = page.getByRole('button', { name: 'Send' });
  await sendButton.click();
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

export async function submitFeedback(page: Page, ratingButtonName: string) {
  // Click the Good/Bad response button
  await page.getByRole('button', { name: ratingButtonName }).click();

  const feedbackCard = page.getByLabel('Why did you choose this rating?');
  await expect(feedbackCard).toBeVisible();

  const optionalFeedback = feedbackCard.getByPlaceholder(
    'Provide optional additional feedback',
  );
  await expect(optionalFeedback).toBeVisible();

  const quickFeedbackLabels = feedbackCard.locator('li');
  const quickFeedbackLabelsCount = await quickFeedbackLabels.count();

  expect(quickFeedbackLabelsCount).toEqual(3);

  await quickFeedbackLabels.first().click();

  // Mock API response for v1/feedback
  await page.route('**/v1/feedback', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        response: 'feedback received',
      }),
    });
  });

  await feedbackCard.getByRole('button', { name: 'Submit' }).click();

  const feedbackConfirmationPanel = page.getByLabel('Feedback submitted');
  await expect(feedbackConfirmationPanel).toBeVisible();
  await expect(feedbackConfirmationPanel).toContainText(
    "We've received your response. Thank you for sharing your feedback!",
  );
  await feedbackConfirmationPanel.waitFor({ state: 'hidden' });
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
  expect(clipboardText).toBe(expectedText);
}

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
import { Page, Locator, FileChooser, expect } from '@playwright/test';
import {
  getElementByRole,
  getTextByContent,
  getSpanContainingText,
  getDivWithExactText,
} from './locatorUtils';

export const supportedFileTypes = ['.txt', '.yaml', '.json'];

export async function triggerFileChooser(
  page: Page,
  buttonLocator: Locator,
): Promise<FileChooser> {
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    buttonLocator.click(),
  ]);
  return fileChooser;
}

export async function uploadFile(page: Page, filePath: string) {
  const attachButton = getElementByRole(page, 'button', 'Attach button');
  await expect(attachButton).toBeVisible({ timeout: 15000 });

  const fileChooser = await triggerFileChooser(page, attachButton);
  await fileChooser.setFiles(filePath);
}

export async function validateSuccessfulUpload(page: Page, fileName: string) {
  const trimmerFilename = fileName.split('.')[0];

  await expect(getElementByRole(page, 'button', fileName)).toBeVisible();

  const spanWithText = getSpanContainingText(page, trimmerFilename).first();
  await spanWithText.click();

  const jsonStarter = getDivWithExactText(page, /^\{$/).first();
  await jsonStarter.waitFor();

  await expect(page.getByRole('banner')).toContainText('Preview attachment');
  await expect(getElementByRole(page, 'button', 'Edit')).toBeVisible();
  await expect(getElementByRole(page, 'button', 'Dismiss')).toBeVisible();

  await getElementByRole(page, 'button', 'Edit').click();

  await expect(getElementByRole(page, 'button', 'Save')).toBeVisible();
  await expect(getElementByRole(page, 'button', 'Cancel')).toBeVisible();

  await getElementByRole(page, 'button', 'Save').click();
  await getElementByRole(page, 'button', 'Close').click();
  await getElementByRole(page, 'button', `Close ${trimmerFilename}`).click();
}

export async function validateFailedUpload(page: Page) {
  const alertHeader = getTextByContent(page, 'File upload failed');
  const alertText = getTextByContent(
    page,
    'Unsupported file type. Supported types are: .txt, .yaml, .json.',
  );
  await expect(alertHeader).toBeVisible();
  await expect(alertText).toBeVisible();

  await getElementByRole(page, 'button', 'Close Danger alert').click();
  await expect(alertHeader).toBeHidden();
  await expect(alertText).toBeHidden();
}

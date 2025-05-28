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

export async function assertDrawerOpenState(page: Page) {
  await expect(
    page.getByRole('button', { name: 'Close drawer panel' }),
  ).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: 'Filter menu items' }),
  ).toBeVisible();
  await expect(page.getByRole('separator', { name: 'Resize' })).toBeVisible();
}

export async function assertChatDialogInitialState(page: Page) {
  await expect(page.getByLabel('Chatbot', { exact: true })).toContainText(
    'Developer Hub Lightspeed',
  );
  await expect(page.getByRole('button', { name: 'Toggle menu' })).toBeVisible();
  await assertDrawerOpenState(page);
}

export async function closeChatDrawer(page: Page) {
  await page.getByRole('button', { name: 'Close drawer panel' }).click();
}

export async function assertDrawerClosedState(page: Page) {
  await expect(page.getByRole('separator', { name: 'Resize' })).toBeHidden();
  await expect(
    page.getByRole('button', { name: 'Close drawer panel' }),
  ).toBeHidden();
  await expect(
    page.getByRole('textbox', { name: 'Filter menu items' }),
  ).toBeHidden();
}

export async function reopenChatDrawer(page: Page) {
  await page.getByRole('button', { name: 'Toggle menu' }).click();
}

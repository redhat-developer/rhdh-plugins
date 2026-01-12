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

/**
 * Deletes RBAC configuration after tests.
 */
export async function deleteRBAC(page: Page) {
  await page.goto('/rbac');
  const enterButton = page.getByRole('button', { name: 'Enter' });
  await expect(enterButton).toBeVisible();
  await enterButton.click();

  await page.getByTestId('delete-role-role:default/rhdh-testing').click();

  await page
    .getByRole('textbox', { name: 'Role name' })
    .fill('role:default/rhdh-testing');

  await page.getByRole('button', { name: 'Delete' }).click();

  await expect(
    page.getByTestId('delete-role-role:default/rhdh-testing'),
  ).toBeHidden();
}

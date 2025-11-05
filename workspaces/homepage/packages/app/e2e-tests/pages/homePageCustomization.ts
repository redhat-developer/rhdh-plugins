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

import { Page, expect, Locator } from '@playwright/test';
import { TestUtils } from '../utils/testUtils.js';

export class HomePageCustomization {
  private page: Page;
  private testUtils: TestUtils;

  private readonly expectedCards = [
    'Good (morning|afternoon|evening)',
    'Quick Access',
    'Explore Your Software Catalog',
    'Explore Templates',
  ];

  // Locators
  private readonly editButton = () => this.page.getByText('Edit');
  private readonly saveButton = () => this.page.getByText('Save');
  private readonly clearAllButton = () => this.page.getByText('Clear all');
  private readonly restoreDefaultsButton = () =>
    this.page.getByText('Restore defaults');
  private readonly addWidgetButton = () =>
    this.page.getByRole('button', { name: 'Add widget' });
  private readonly resizeHandles = () =>
    this.page.locator('.react-resizable-handle');
  private readonly deleteButtons = () =>
    this.page.locator('[class*="MuiGrid-root"][class*="overlayGridItem"]');
  private readonly greetingText = () =>
    this.page.getByText(/Good (morning|afternoon|evening)/);

  constructor(page: Page) {
    this.page = page;
    this.testUtils = new TestUtils(page);
  }

  async verifyHomePageLoaded(): Promise<void> {
    await this.testUtils.verifyHeading('Welcome back');
    await expect(this.greetingText()).toBeVisible();
    const quickstart = this.page.getByRole('button', { name: 'Hide' });
    if (await quickstart.isVisible()) {
      await quickstart.click();
    }
  }

  async verifyAllCardsDisplayed(): Promise<void> {
    for (const card of this.expectedCards) {
      if (card.includes('Good')) {
        await expect(this.greetingText()).toBeVisible();
      } else {
        await this.testUtils.verifyText(card);
      }
    }
  }

  async verifyEditButtonVisible(): Promise<void> {
    await this.testUtils.verifyText('Edit');
  }

  async enterEditMode(): Promise<void> {
    await this.testUtils.clickButton('Edit');
    await expect(this.saveButton()).toBeVisible();
  }

  async exitEditMode(): Promise<void> {
    await this.testUtils.clickButton('Save');
    await expect(this.editButton()).toBeVisible();
  }

  async resizeAllCards(): Promise<void> {
    const allHandles = this.resizeHandles();
    const handleCount = await allHandles.count();
    expect(handleCount).toBeGreaterThan(0);

    // Store initial dimensions
    const initialDimensions = await this.getPanelDimensions(
      allHandles,
      handleCount,
    );

    // Resize all panels
    await this.performResizeOnAllPanels(allHandles, handleCount);

    // Verify all panels were resized
    await this.verifyPanelsResized(allHandles, handleCount, initialDimensions);
  }

  private async getPanelDimensions(
    allHandles: Locator,
    handleCount: number,
  ): Promise<Array<{ width: number; height: number }>> {
    const initialDimensions: Array<{ width: number; height: number }> = [];
    for (let i = 0; i < handleCount; i++) {
      const panel = allHandles.nth(i).locator('..').locator('..');
      const box = await panel.boundingBox();
      expect(box).not.toBeNull();
      initialDimensions.push({ width: box!.width, height: box!.height });
    }
    return initialDimensions;
  }

  private async performResizeOnAllPanels(
    allHandles: Locator,
    handleCount: number,
  ): Promise<void> {
    for (let i = 0; i < handleCount; i++) {
      const handle = allHandles.nth(i);
      const elementHandle = await handle.elementHandle();
      if (!elementHandle) {
        continue; // Skip if element handle is null
      }

      await this.page.evaluate(handleElement => {
        if (!handleElement) return;

        const rect = handleElement.getBoundingClientRect();
        const startX = rect.left + rect.width / 2;
        const startY = rect.top + rect.height / 2;
        const endX = startX + 300;
        const endY = startY + 300;

        const mouseDown = new MouseEvent('mousedown', {
          clientX: startX,
          clientY: startY,
          bubbles: true,
        });
        handleElement.dispatchEvent(mouseDown);

        setTimeout(() => {
          const mouseMove = new MouseEvent('mousemove', {
            clientX: endX,
            clientY: endY,
            bubbles: true,
          });
          handleElement.dispatchEvent(mouseMove);

          setTimeout(() => {
            const mouseUp = new MouseEvent('mouseup', {
              clientX: endX,
              clientY: endY,
              bubbles: true,
            });
            handleElement.dispatchEvent(mouseUp);
          }, 200);
        }, 200);
      }, elementHandle);

      await this.page.waitForTimeout(500);
    }
  }

  private async verifyPanelsResized(
    allHandles: Locator,
    handleCount: number,
    initialDimensions: Array<{ width: number; height: number }>,
  ): Promise<void> {
    for (let i = 0; i < handleCount; i++) {
      const panel = allHandles.nth(i).locator('..').locator('..');
      const finalBox = await panel.boundingBox();
      expect(finalBox).not.toBeNull();

      const widthChanged = finalBox!.width !== initialDimensions[i].width;
      const heightChanged = finalBox!.height !== initialDimensions[i].height;
      expect(widthChanged || heightChanged).toBe(true);
    }
  }

  async deleteAllCards(): Promise<void> {
    let currentButtons = this.deleteButtons();
    let currentCount = await currentButtons.count();

    // Loop as long as there are delete buttons visible
    while (currentCount > 0) {
      await currentButtons.first().click();
      await this.page.waitForTimeout(1000); // Wait for deletion to complete

      // Re-evaluate the count for the next iteration
      currentButtons = this.deleteButtons();
      currentCount = await currentButtons.count();
    }
  }

  async clearAllCardsWithButton(): Promise<void> {
    await this.testUtils.clickButton('Clear all');
  }

  async verifyCardsDeleted(): Promise<void> {
    // Verify UI state after deletion
    await expect(this.clearAllButton()).toBeHidden();
    await expect(this.saveButton()).toBeHidden();
    await expect(this.restoreDefaultsButton()).toBeVisible();
    await expect(this.addWidgetButton()).toBeVisible();

    // Verify that all cards are not present on the page
    for (const card of this.expectedCards) {
      if (card.includes('Good')) {
        await expect(this.greetingText()).toBeHidden();
      } else {
        await expect(this.page.getByText(card)).toBeHidden();
      }
    }
  }

  async restoreDefaultCards(): Promise<void> {
    await this.testUtils.clickButton('Restore defaults');
    await this.page.waitForTimeout(2000);
    await this.saveButton().click();
  }

  async verifyCardsRestored(): Promise<void> {
    await this.verifyAllCardsDisplayed();
    await expect(this.editButton()).toBeVisible();
  }

  async addWidget(widgetType: string = 'OnboardingSection'): Promise<void> {
    await this.testUtils.clickButton('Add widget');
    await this.page.waitForTimeout(1000); // Wait for dialog to open

    // Select the specific widget type from the dialog
    await this.page.getByRole('button', { name: widgetType }).click();
    await this.page.waitForTimeout(1000);
  }
}

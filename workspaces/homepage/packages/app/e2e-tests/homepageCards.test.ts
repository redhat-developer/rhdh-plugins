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
import { TestUtils } from './utils/testUtils.js';

test.describe('Homepage Card Individual Tests', () => {
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
    await testUtils.loginAsGuest();
  });

  test('Verify OnboardingSection Card Content and Links', async ({ page }) => {
    // Verify card heading
    await expect(
      page.getByText(/Good (morning|afternoon|evening)/),
    ).toBeVisible();

    // Verify "Get started" section
    await testUtils.verifyTextInCard('Good', 'Get started');
    await testUtils.verifyTextInCard(
      'Good',
      'Learn about Red Hat Developer Hub.',
    );
    await testUtils.verifyLinkInCard('Good', 'Read documentation');
    await testUtils.verifyLinkURLInCard(
      'Good',
      'Read documentation',
      'docs.redhat.com',
    );

    // Verify "Explore" section
    await testUtils.verifyTextInCard('Good', 'Explore');
    await testUtils.verifyTextInCard(
      'Good',
      'Explore components, APIs and templates.',
    );
    await testUtils.verifyLinkInCard('Good', 'Go to Catalog');
    await testUtils.verifyLinkURLInCard('Good', 'Go to Catalog', '/catalog');

    // Verify "Learn" section
    await testUtils.verifyTextInCard('Good', 'Learn');
    await testUtils.verifyTextInCard('Good', 'Explore and develop new skills.');
    await testUtils.verifyLinkInCard('Good', 'Go to Learning Paths');
    await testUtils.verifyLinkURLInCard(
      'Good',
      'Go to Learning Paths',
      '/learning-paths',
    );
  });

  test('Verify EntitySection Card Content and Links', async ({ page }) => {
    // Verify card heading
    await testUtils.verifyText('Explore Your Software Catalog');

    // Verify introductory text
    await testUtils.verifyTextInCard(
      'Explore Your Software Catalog',
      'Browse the Systems, Components, Resources, and APIs that are available in your organization.',
    );

    // Verify entity links are visible
    await testUtils.verifyLinkInCard(
      'Explore Your Software Catalog',
      'examples',
    );

    await testUtils.verifyLinkInCard(
      'Explore Your Software Catalog',
      'example-grpc-api',
    );

    // Verify "View all" link
    await testUtils.verifyLinkInCard(
      'Explore Your Software Catalog',
      'View all 4 catalog entities',
    );
  });

  test('Verify TemplateSection Card Content and Links', async ({ page }) => {
    // Verify card heading
    await testUtils.verifyText('Explore Templates');

    // Verify empty state text
    await testUtils.verifyTextInCard(
      'Explore Templates',
      'No templates added yet',
    );
    await testUtils.verifyTextInCard(
      'Explore Templates',
      'Once templates are added, this space will showcase relevant content tailored to your experience.',
    );

    // Verify register template link
    await testUtils.verifyLinkInCard(
      'Explore Templates',
      'Register a template',
    );
    await testUtils.verifyLinkURLInCard(
      'Explore Templates',
      'Register a template',
      '/catalog-import',
    );
  });
});

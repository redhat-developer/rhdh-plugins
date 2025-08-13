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

/**
 * Get Red Hat EDDL data attributes for tracking clicks
 * These attributes will be automatically captured by dpal.js for Adobe Analytics
 *
 * @param itemName - The text content to track (e.g., product name, article title)
 * @param section - The section type ('Catalog', 'Activities', 'Support', or 'Verification')
 * @returns Object with Red Hat EDDL data attributes
 */
export const getEddlDataAttributes = (
  itemName: string,
  section: 'Catalog' | 'Activities' | 'Support' | 'Verification' = 'Catalog',
) => ({
  'data-analytics-category': `Developer Sandbox|${section}`,
  'data-analytics-text': itemName,
  'data-analytics-region': `sandbox-${section.toLocaleLowerCase('en-US')}`,
});

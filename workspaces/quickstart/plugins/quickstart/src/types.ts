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
 * Call-to-action data for quickstart items
 * @public
 */
export interface QuickstartItemCtaData {
  /** The text to display for the CTA button */
  text: string;
  /** Translation key for the CTA text */
  textKey?: string;
  /** The URL to navigate to when clicked */
  link: string;
}

/**
 * Configuration data for a quickstart item
 * @public
 */
export interface QuickstartItemData {
  /** The title of the quickstart item */
  title: string;
  /** Translation key for the title */
  titleKey?: string;
  /** Array of roles that can access this item (defaults to ['admin'] if not specified) */
  roles?: string[];
  /** Icon identifier for the item */
  icon?: string;
  /** Description text for the item */
  description: string;
  /** Translation key for the description */
  descriptionKey?: string;
  /** Call-to-action configuration */
  cta?: QuickstartItemCtaData;
}

/**
 * User role type for quickstart functionality
 * @public
 */
export type UserRole = 'admin' | 'developer';

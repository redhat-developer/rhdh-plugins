/*
 * Copyright The Backstage Authors
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
 * @public
 */
export enum ExtensionsSupportLevel {
  GENERALLY_AVAILABLE = 'generally-available',
  TECH_PREVIEW = 'tech-preview',
  DEV_PREVIEW = 'dev-preview',
  COMMUNITY = 'community',
  NONE = 'none',
}

/**
 * @public
 * @deprecated Use ExtensionsSupportLevel instead
 */
// export const ExtensionsSupportLevel = ExtensionsSupportLevel;

/**
 * @public
 */
export type ExtensionsSupport = {
  // Technically both attributes are required, but we expecting undefined anyway
  provider?: string;
  // Technically both attributes are required, but we expecting undefined anyway
  level?: ExtensionsSupportLevel;
};

/**
 * @public
 * @deprecated Use ExtensionsSupport instead
 */
// export type ExtensionsSupport = ExtensionsSupport;

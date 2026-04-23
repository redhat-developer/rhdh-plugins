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
import {
  createPermission,
  ResourcePermission,
} from '@backstage/plugin-permission-common';

/**
 * @public
 */
export const RESOURCE_TYPE_HOMEPAGE_DEFAULT_CARD = 'homepage-default-card';

/**
 * @public
 * Convenience type for homepage default card permissions
 */
export type HomepageDefaultCardPermission = ResourcePermission<
  typeof RESOURCE_TYPE_HOMEPAGE_DEFAULT_CARD
>;

/** This permission is used to read the homepage default cards endpoint
 * @public
 */
export const homepageDefaultCardsReadPermission = createPermission({
  name: 'homepage.default-cards.read',
  attributes: {
    action: 'read',
  },
  resourceType: RESOURCE_TYPE_HOMEPAGE_DEFAULT_CARD,
});

/**
 * @public
 */
export const homepagePermissions = [homepageDefaultCardsReadPermission];

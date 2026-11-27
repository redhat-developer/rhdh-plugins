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

import { createPermission } from '@backstage/plugin-permission-common';

/**
 * Grants access to list pull requests awaiting the caller's review.
 *
 * @public
 */
export const pullRequestReadPermission = createPermission({
  name: 'pr-compass.pull-request.read',
  attributes: {
    action: 'read',
  },
});

/**
 * All permissions registered by the PR Compass backend.
 *
 * @public
 */
export const prCompassPermissions = [pullRequestReadPermission];

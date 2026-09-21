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

import { AutoLogout } from '@backstage/core-components';
import { AppRootElementBlueprint } from '@backstage/frontend-plugin-api';

/**
 * App-root element that mounts the AutoLogout mechanism in the NFS app.
 *
 * The AutoLogout component reads its configuration directly from `configApiRef`
 * under the `auth.autologout.*` keys, giving operator-supplied config precedence
 * over the props below.  The prop values are conservative fallbacks that match
 * the behaviour of the legacy OFS AppBase:
 *
 * - `enabled: false`        – feature is opt-in; operators must set
 *                             `auth.autologout.enabled: true` to activate it.
 * - `idleTimeoutMinutes: 60` – 60-minute idle window when enabled.
 * - `useWorkerTimers: false` – avoids worker-thread timer compatibility issues
 *                             across the browser matrix RHDH targets.
 *
 * @public
 */
export const autoLogoutElement = AppRootElementBlueprint.make({
  name: 'auto-logout',
  params: {
    element: (
      <AutoLogout
        enabled={false}
        idleTimeoutMinutes={60}
        useWorkerTimers={false}
      />
    ),
  },
});

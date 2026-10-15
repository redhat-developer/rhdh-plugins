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

import type { ComponentType } from 'react';

/**
 * App header contributed by a plugin via {@link AppHeaderBlueprint}.
 *
 * @public
 */
export interface AppHeaderData {
  /** Extension ID of the contributing extension, used as a stable key. */
  id: string;
  /** Component rendered as the header bar. */
  component: ComponentType<{}>;
  /**
   * Ordering priority when multiple headers are registered. Higher values
   * render first, i.e. closer to the top of the viewport. Defaults to `0`.
   */
  priority?: number;
}

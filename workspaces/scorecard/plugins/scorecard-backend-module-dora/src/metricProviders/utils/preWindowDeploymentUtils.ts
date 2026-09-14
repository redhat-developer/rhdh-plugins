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

import type { DbDoraDeployment } from '../../database/types';

/**
 * Puts the latest pre-window production deployment in front of in-window
 * production deployments so existing pairing loops can score the first
 * in-window deploy.
 */
export function prependPreWindowDeployment(
  preWindow: DbDoraDeployment | undefined,
  inWindowProduction: DbDoraDeployment[],
): DbDoraDeployment[] {
  return preWindow ? [preWindow, ...inWindowProduction] : inWindowProduction;
}

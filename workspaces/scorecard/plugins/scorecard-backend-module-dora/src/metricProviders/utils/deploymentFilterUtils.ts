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
 * Missing/unknown environment is treated as production. Named environments must
 * match one of the configured production environment names (case-insensitive).
 *
 * Only successful deployments are persisted; callers filter by environment.
 */
export function isProductionEnvironment(
  environment: string | null | undefined,
  productionEnvironments: string[],
): boolean {
  if (!environment) {
    return true;
  }

  const normalizedEnvironment = environment.toLowerCase();
  return productionEnvironments.some(
    name => name.toLowerCase() === normalizedEnvironment,
  );
}

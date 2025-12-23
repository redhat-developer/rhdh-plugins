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
<<<<<<<< HEAD:workspaces/scorecard/plugins/scorecard-backend-module-openssf/src/index.ts
 * The openssf backend module for the scorecard plugin.
 *
 * @packageDocumentation
 */

export { scorecardOpenSFFModule as default } from './module';
========
 * Parse a comma separated string into an array of strings
 *
 * @param value - The comma separated string to parse
 * @returns The array of strings
 */
export function parseCommaSeparatedString(value: string): string[] {
  return value.split(',').map(id => id.trim());
}
>>>>>>>> 84afdf20 (feat(scorecard): implement endpoint to aggregate metrics for scorecard):workspaces/scorecard/plugins/scorecard-backend/src/utils/parseCommaSeparatedString.ts

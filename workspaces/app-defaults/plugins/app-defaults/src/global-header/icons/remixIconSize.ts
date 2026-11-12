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
 * Maps header icon size tokens to Remix `size` (px).
 *
 * @internal
 */
export function remixIconSize(
  size: 'medium' | 'large' | 'small' | undefined,
): number {
  switch (size) {
    case 'small':
      return 20;
    case 'large':
      return 35;
    case 'medium':
    default:
      return 24;
  }
}

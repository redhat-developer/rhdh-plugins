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
 * Check if the user is a guest user.
 * Guest users have userEntityRef like "user:default/guest" or "user:development/guest"
 *
 * @param user - The user entity ref (e.g., "user:default/john")
 * @returns true if the user is a guest user, false otherwise
 */
export const isGuestUser = (user: string | undefined): boolean => {
  if (!user) return true;
  return user.endsWith('/guest');
};

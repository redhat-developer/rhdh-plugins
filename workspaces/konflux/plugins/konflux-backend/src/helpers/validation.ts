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
 * Validates user email for impersonation
 * Returns validated email or throws error if invalid
 */
export const validateUserEmailForImpersonation = (
  email: string | undefined,
  authProvider: string | undefined,
): string => {
  // Only validate if impersonation is being used
  if (authProvider !== 'impersonationHeaders') {
    return email || '';
  }

  if (!email || email.trim().length === 0) {
    throw new Error(
      'User email is required for impersonation but was not found in user entity',
    );
  }

  const trimmedEmail = email.trim();

  if (trimmedEmail.length > 254) {
    throw new Error(`Invalid email format: email too long`);
  }

  // basic email format validation
  const emailRegex =
    /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmedEmail)) {
    throw new Error(`Invalid email format: ${trimmedEmail}`);
  }

  return trimmedEmail;
};

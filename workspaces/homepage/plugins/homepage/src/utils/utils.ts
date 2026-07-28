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
export const getDismissedEntityIllustrationUsers = () => {
  const dismissedEntityIllustrationUsers = localStorage.getItem(
    'homepage/dismissedEntityIllustrationUsers',
  );
  return dismissedEntityIllustrationUsers
    ? JSON.parse(dismissedEntityIllustrationUsers)
    : [];
};

export const addDismissedEntityIllustrationUsers = (username: string) => {
  const dismissedEntityIllustrationUsers =
    getDismissedEntityIllustrationUsers();
  if (!dismissedEntityIllustrationUsers.includes(username)) {
    dismissedEntityIllustrationUsers.push(username);
    localStorage.setItem(
      'homepage/dismissedEntityIllustrationUsers',
      JSON.stringify(dismissedEntityIllustrationUsers),
    );
  }
};

export const hasEntityIllustrationUserDismissed = (username: string) => {
  const dismissedEntityIllustrationUsers =
    getDismissedEntityIllustrationUsers();
  return dismissedEntityIllustrationUsers.includes(username);
};

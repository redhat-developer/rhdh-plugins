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

export const mockEntities = [
  {
    apiVersion: '1',
    kind: 'User',
    metadata: {
      name: 'user-1',
      title: 'User 1',
    },
  },
  {
    apiVersion: '1',
    kind: 'User',
    metadata: {
      name: 'guest',
      title: 'Guest',
    },
  },
  {
    apiVersion: '1',
    kind: 'User',
    metadata: {
      name: 'user-2',
      title: 'User 2',
    },
  },
  {
    apiVersion: '1',
    kind: 'Group',
    metadata: {
      name: 'group-1',
      title: 'Group 1',
    },
  },
  {
    apiVersion: '1',
    kind: 'Group',
    metadata: {
      name: 'Group-2',
      title: 'Group 2',
    },
  },
];

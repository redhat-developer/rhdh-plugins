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

import { QuickstartItemData } from '../types';

export const mockQuickstartItems: QuickstartItemData[] = [
  // Steps for Admin
  {
    title: 'Step 1 for Admin',
    description: 'Description for Step 1',
    icon: 'bolt',
    roles: ['admin'],
    cta: {
      text: 'Start Now',
      link: '#',
    },
  },
  {
    title: 'Step 2 for Admin',
    description: 'Description for Step 2',
    icon: 'code',
    roles: ['admin'],
    cta: {
      text: 'Continue',
      link: '#',
    },
  },

  // Steps for Developer
  {
    title: 'Step 1 for Developer',
    description: 'Description for Step 1',
    icon: 'bolt',
    roles: ['developer'],
    cta: {
      text: 'Start Now',
      link: '#',
    },
  },
  {
    title: 'Step 2 for Developer',
    description: 'Description for Step 2',
    icon: 'code',
    roles: ['developer'],
    cta: {
      text: 'Continue',
      link: '#',
    },
  },
  // Step without any roles (Default to admin role if no roles are assigned)
  {
    title: 'Step 1 - No Roles Assigned',
    description: 'Description for Step 1 (No roles assigned)',
    icon: 'bolt',
    cta: {
      text: 'Start Now',
      link: '#',
    },
  },
  {
    title: 'Step 2 - No Roles Assigned',
    description: 'Description for Step 2 (No roles assigned)',
    icon: 'code',
    cta: {
      text: 'Continue',
      link: '#',
    },
  },
];

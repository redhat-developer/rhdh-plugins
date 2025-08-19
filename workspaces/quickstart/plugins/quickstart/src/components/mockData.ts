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

// Reusable CTA objects
const CTAS = {
  start: { text: 'Start Now', link: '#' },
  continue: { text: 'Continue', link: '#' },
} as const;

// Common icons
const ICONS = {
  step1: 'bolt',
  step2: 'code',
} as const;

// Helper function to create role-based steps
const createRoleSteps = (role: string): QuickstartItemData[] => [
  {
    title: `Step 1 for ${role}`,
    description: 'Description for Step 1',
    icon: ICONS.step1,
    roles: [role.toLowerCase()],
    cta: CTAS.start,
  },
  {
    title: `Step 2 for ${role}`,
    description: 'Description for Step 2',
    icon: ICONS.step2,
    roles: [role.toLowerCase()],
    cta: CTAS.continue,
  },
];

// Helper function to create no-role steps
const createNoRoleSteps = (): QuickstartItemData[] => [
  {
    title: 'Step 1 - No Roles Assigned',
    description: 'Description for Step 1 (No roles assigned)',
    icon: ICONS.step1,
    cta: CTAS.start,
  },
  {
    title: 'Step 2 - No Roles Assigned',
    description: 'Description for Step 2 (No roles assigned)',
    icon: ICONS.step2,
    cta: CTAS.continue,
  },
];

export const mockQuickstartItems: QuickstartItemData[] = [
  ...createRoleSteps('Admin'),
  ...createRoleSteps('Developer'),
  ...createNoRoleSteps(),
];

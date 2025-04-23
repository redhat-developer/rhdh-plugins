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
export const LEARNING_SECTION_ITEMS = [
  {
    title: 'Get started',
    description: 'Learn about Red Hat Developer Hub.',
    buttonText: 'Read documentation',
    buttonLink:
      'https://docs.redhat.com/en/documentation/red_hat_developer_hub/',
    target: '_blank',
    ariaLabel: 'Read documentation (opens in a new tab)',
  },
  {
    title: 'Explore',
    description: 'Explore components, APIs and templates.',
    buttonText: 'Go to Catalog',
    buttonLink: '/catalog',
    target: undefined,
    ariaLabel: 'Go to Catalog',
  },
  {
    title: 'Learn',
    description: 'Explore and develop new skills.',
    buttonText: 'Go to Learning Paths',
    buttonLink: '/learning-paths',
    target: undefined,
    ariaLabel: 'Go to Learning Paths',
  },
];

export const KINDS = {
  COMPONENT: {
    label: 'Component',
    fill: '#FFE082',
  },
  API: {
    label: 'API',
    fill: '#FFAB91',
  },
  RESOURCE: {
    label: 'Resource',
    fill: '#FFD180',
  },
  SYSTEM: {
    label: 'System',
    fill: '#FF9E80',
  },
};

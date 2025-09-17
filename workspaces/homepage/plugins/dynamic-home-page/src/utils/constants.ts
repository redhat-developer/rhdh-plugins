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

import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { TranslationFunction } from '@backstage/core-plugin-api/alpha';

import { LearningSectionItem } from '../types';
import { homepageTranslationRef } from '../translations';

export const getLearningItems = (
  t: TranslationFunction<typeof homepageTranslationRef.T>,
): LearningSectionItem[] => [
  {
    title: t('onboarding.getStarted.title'),
    description: t('onboarding.getStarted.description'),
    buttonText: t('onboarding.getStarted.buttonText'),
    buttonLink:
      'https://docs.redhat.com/en/documentation/red_hat_developer_hub/',
    target: '_blank',
    ariaLabel: t('onboarding.getStarted.ariaLabel'),
    endIcon: OpenInNewIcon,
  },
  {
    title: t('onboarding.explore.title'),
    description: t('onboarding.explore.description'),
    buttonText: t('onboarding.explore.buttonText'),
    buttonLink: '/catalog',
    target: undefined,
    ariaLabel: t('onboarding.explore.ariaLabel'),
    endIcon: ArrowForwardIcon,
  },
  {
    title: t('onboarding.learn.title'),
    description: t('onboarding.learn.description'),
    buttonText: t('onboarding.learn.buttonText'),
    buttonLink: '/learning-paths',
    target: undefined,
    ariaLabel: t('onboarding.learn.ariaLabel'),
    endIcon: ArrowForwardIcon,
  },
];

// Keep the original for backwards compatibility or fallback
export const LEARNING_SECTION_ITEMS: LearningSectionItem[] = [
  {
    title: 'Get started',
    description: 'Learn about Red Hat Developer Hub.',
    buttonText: 'Read documentation',
    buttonLink:
      'https://docs.redhat.com/en/documentation/red_hat_developer_hub/',
    target: '_blank',
    ariaLabel: 'Read documentation (opens in a new tab)',
    endIcon: OpenInNewIcon,
  },
  {
    title: 'Explore',
    description: 'Explore components, APIs and templates.',
    buttonText: 'Go to Catalog',
    buttonLink: '/catalog',
    target: undefined,
    ariaLabel: 'Go to Catalog',
    endIcon: ArrowForwardIcon,
  },
  {
    title: 'Learn',
    description: 'Explore and develop new skills.',
    buttonText: 'Go to Learning Paths',
    buttonLink: '/learning-paths',
    target: undefined,
    ariaLabel: 'Go to Learning Paths',
    endIcon: ArrowForwardIcon,
  },
];

// Backstage technical terms should not be translated
// Keep as English domain-specific vocabulary
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

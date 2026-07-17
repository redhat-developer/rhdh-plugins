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

import type { ComponentType } from 'react';

import { TranslationFunction } from '@backstage/core-plugin-api/alpha';

import { mockT } from '../../test-utils/mockTranslations';
import { homepageTranslationRef } from '../../translations/ref';
import {
  Breakpoint,
  type HomePageCardMountPoint,
  type Layout,
} from '../../types';
import {
  getCardDescription,
  getCardTitle,
  isCardADefaultConfiguration,
} from '../customizable-cards';

const t = mockT as TranslationFunction<typeof homepageTranslationRef.T>;

function createCardMountPoint(
  displayName: string,
  config: HomePageCardMountPoint['config'] = {},
): HomePageCardMountPoint {
  const Component = (() => null) as ComponentType;
  Component.displayName = displayName;

  return {
    Component,
    config,
  };
}

describe('customizable-cards', () => {
  describe('isCardADefaultConfiguration', () => {
    it('returns true when layouts are configured', () => {
      const card = createCardMountPoint('MyCard', {
        id: 'custom-card',
        layouts: {
          [Breakpoint.xs]: { x: 0, y: 0, w: 1, h: 1 },
        } as Record<Breakpoint, Layout>,
      });

      expect(isCardADefaultConfiguration(card)).toBe(true);
    });

    it('returns true when no id is configured for backward compatibility', () => {
      const card = createCardMountPoint('MyCard');

      expect(isCardADefaultConfiguration(card)).toBe(true);
    });

    it('returns false when id is configured without layouts', () => {
      const card = createCardMountPoint('MyCard', { id: 'custom-card' });

      expect(isCardADefaultConfiguration(card)).toBe(false);
    });
  });

  describe('getCardTitle', () => {
    it('returns translated title from titleKey', () => {
      const card = createCardMountPoint('MyCard', {
        titleKey: 'featuredDocs.title',
        title: 'Fallback title',
      });

      expect(getCardTitle(t, card)).toBe('Featured Docs');
    });

    it('returns configured title when titleKey is not provided', () => {
      const card = createCardMountPoint('MyCard', {
        title: 'Custom title',
      });

      expect(getCardTitle(t, card)).toBe('Custom title');
    });

    it('falls back to component display name', () => {
      const card = createCardMountPoint('MyCard');

      expect(getCardTitle(t, card)).toBe('MyCard');
    });

    it('strips Extension() wrapper from component display name', () => {
      const card = createCardMountPoint('Extension(QuickAccessCard)');

      expect(getCardTitle(t, card)).toBe('QuickAccessCard');
    });
  });

  describe('getCardDescription', () => {
    it('returns translated description from descriptionKey', () => {
      const card = createCardMountPoint('MyCard', {
        title: 'Card title',
        descriptionKey: 'onboarding.getStarted.description',
        description: 'Fallback description',
      });

      expect(getCardDescription(t, card)).toBe(
        'Learn about Red Hat Developer Hub.',
      );
    });

    it('returns configured description when descriptionKey is not provided', () => {
      const card = createCardMountPoint('MyCard', {
        title: 'Card title',
        description: 'Card description',
      });

      expect(getCardDescription(t, card)).toBe('Card description');
    });

    it('falls back to props.title when description is not configured', () => {
      const card = createCardMountPoint('MyCard', {
        title: 'Card title',
        props: { title: 'Props title' },
      });

      expect(getCardDescription(t, card)).toBe('Props title');
    });

    it('falls back to props.debugContent when no description is configured', () => {
      const card = createCardMountPoint('MyCard', {
        title: 'Card title',
        props: { debugContent: 'Debug content' },
      });

      expect(getCardDescription(t, card)).toBe('Debug content');
    });

    it('returns undefined when description matches the card title', () => {
      const card = createCardMountPoint('MyCard', {
        title: 'Same text',
        description: 'Same text',
      });

      expect(getCardDescription(t, card)).toBeUndefined();
    });
  });
});

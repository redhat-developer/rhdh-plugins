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

import {
  attachComponentData,
  getComponentData,
} from '@backstage/core-plugin-api';
import { createElement } from 'react';

import { HomePageCardConfig } from '../types';
import { mockT } from '../test-utils/mockTranslations';
import { translateHomepageWidget } from './translateHomepageWidgets';

function createWidgetWithMetadata() {
  const WidgetWithMetadata = ({ title }: { title?: string }) =>
    createElement('div', null, title);
  attachComponentData(WidgetWithMetadata, 'title', 'Original title');
  attachComponentData(
    WidgetWithMetadata,
    'description',
    'Recently visited description',
  );
  return WidgetWithMetadata;
}

function createCard(
  overrides: Partial<HomePageCardConfig> = {},
): HomePageCardConfig {
  const WidgetWithMetadata = createWidgetWithMetadata();

  return {
    node: {} as HomePageCardConfig['node'],
    component: createElement(WidgetWithMetadata, { title: 'Original title' }),
    name: 'Recently visited',
    title: 'Recently visited',
    description: 'Recently visited description',
    ...overrides,
  };
}

describe('translateHomepageWidget', () => {
  it('returns the card unchanged when the widget name is not mapped', () => {
    const card = createCard({ name: 'Unknown widget' });

    expect(translateHomepageWidget(card, mockT)).toBe(card);
  });

  it('returns the card unchanged when the component is not a valid element', () => {
    const card = createCard({
      component: 'not-an-element' as unknown as HomePageCardConfig['component'],
    });

    expect(translateHomepageWidget(card, mockT)).toBe(card);
  });

  it('translates title and description and updates component metadata', () => {
    const card = createCard();

    const translated = translateHomepageWidget(card, mockT);

    expect(translated.title).toBe('Recently Visited');
    expect(translated.description).toBe(
      'Quick access to recently viewed entities and pages',
    );
    expect(translated.component.props.title).toBe('Recently Visited');
    expect(getComponentData(translated.component, 'title')).toBe(
      'Recently Visited',
    );
    expect(getComponentData(translated.component, 'description')).toBe(
      'Quick access to recently viewed entities and pages',
    );
  });

  it('clears description metadata when the widget has no description key', () => {
    const card = createCard({
      name: 'Search',
      title: 'Search',
      description: 'Search your developer portal',
    });

    const translated = translateHomepageWidget(card, mockT);

    expect(translated.title).toBe('Search');
    expect(translated.description).toBe('Search your developer portal');
    expect(getComponentData(translated.component, 'description')).toBe(
      undefined,
    );
    expect(translated.component).toBe(card.component);
  });

  it('does not pass a translated title to the card when hideTitleOnCard is set', () => {
    const WidgetWithMetadata = createWidgetWithMetadata();
    const card = createCard({
      name: 'Red Hat Developer Hub - Onboarding',
      title: 'Red Hat Developer Hub - Onboarding',
      description: undefined,
      component: createElement(WidgetWithMetadata),
    });

    const translated = translateHomepageWidget(card, mockT);

    expect(translated.title).toBe('Red Hat Developer Hub - Onboarding');
    expect(translated.component).toBe(card.component);
    expect(translated.component.props.title).toBeUndefined();
  });
});

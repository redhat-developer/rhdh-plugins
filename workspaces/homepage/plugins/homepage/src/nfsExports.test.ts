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

import homePlugin from '@backstage/plugin-home/alpha';
import translationsModuleDefault from './homepageTranslationsModuleExport';
import {
  homepageHomeModule,
  homepagePlugin,
  homepageTranslationsModule,
  homePageModule,
  homePagePlugin,
} from '.';
import { homepageTranslationRef, homepageTranslations } from './translations';
import { homePageLayoutExtension } from './extensions/homePageLayoutExtension';
import { HOMEPAGE_PAGE_ID } from './extensions/homepageAttach';
import {
  communityHomeWidgets,
  onboardingSectionWidget,
  entitySectionWidget,
  templateSectionWidget,
  quickAccessCardWidget,
  searchBarWidget,
  featuredDocsCardWidget,
  catalogStarredWidget,
  disableRandomJoke,
  disableToolkit,
  RecentlyVisitedWidget,
  TopVisitedWidget,
} from './extensions/homePageCards';
import { quickAccessApi, defaultWidgetsApi } from './extensions/apis';

type ExtensionAttach = { id: string; input: string };

type RuntimeExtension = {
  id: string;
  attachTo?: ExtensionAttach;
  disabled?: boolean;
};

function getRuntimeExtensions(feature: object): RuntimeExtension[] {
  const extensions = (feature as { extensions?: RuntimeExtension[] })
    .extensions;
  expect(extensions).toBeDefined();
  return extensions!;
}

function getAttachTo(extension: RuntimeExtension): ExtensionAttach {
  expect(extension.attachTo).toBeDefined();
  return extension.attachTo!;
}

const COMMUNITY_DEMO_OVERRIDE_IDS = [
  'home-page-widget:home/starred-entities',
  'home-page-widget:home/toolkit',
  'home-page-widget:home/random-joke',
] as const;

describe('Dynamic Home Page plugin (NFS)', () => {
  describe('Install models', () => {
    it('homepagePlugin owns page:homepage with widgets attached to it', () => {
      expect(homepagePlugin).toBeDefined();
      expect(homepagePlugin.$$type).toBe('@backstage/FrontendPlugin');
      expect(homepagePlugin.id).toBe('homepage');
      expect(homepagePlugin.id).not.toBe(homePlugin.id);
      expect(homePagePlugin).toBe(homepagePlugin);
      expect(homepagePlugin.getExtension(HOMEPAGE_PAGE_ID)).toBeDefined();
      expect(
        homepagePlugin.getExtension(
          'home-page-widget:homepage/rhdh-onboarding-section',
        ),
      ).toBeDefined();
      expect(
        homepagePlugin.getExtension(
          'home-page-layout:homepage/dynamic-homepage-layout',
        ),
      ).toBeDefined();
      expect(
        getRuntimeExtensions(homepagePlugin).some(
          ext => ext.id === 'page:home',
        ),
      ).toBe(false);
    });

    it('homepageHomeModule mirrors RH widgets onto page:home without RH layout', () => {
      expect(homepageHomeModule).toBeDefined();
      expect(homepageHomeModule.$$type).toBe('@backstage/FrontendModule');
      expect(homepageHomeModule.pluginId).toBe('home');
      expect(homePageModule).toBe(homepageHomeModule);
      expect(communityHomeWidgets).toHaveLength(9);

      const extensions = getRuntimeExtensions(homepageHomeModule);
      const ids = extensions.map(ext => ext.id);

      expect(ids).toEqual(
        expect.arrayContaining([
          'home-page-widget:home/rhdh-onboarding-section',
          'home-page-widget:home/quickaccess-card',
          ...COMMUNITY_DEMO_OVERRIDE_IDS,
        ]),
      );
      expect(ids).not.toContain(
        'home-page-widget:homepage/rhdh-onboarding-section',
      );
      expect(ids).not.toContain(
        'home-page-layout:home/dynamic-homepage-layout',
      );
      expect(ids.some(id => id.startsWith('api:'))).toBe(false);

      const mirroredWidgets = extensions.filter(
        ext =>
          ext.id.startsWith('home-page-widget:home/') &&
          !COMMUNITY_DEMO_OVERRIDE_IDS.includes(
            ext.id as (typeof COMMUNITY_DEMO_OVERRIDE_IDS)[number],
          ),
      );
      expect(mirroredWidgets).toHaveLength(communityHomeWidgets.length);

      for (const ext of mirroredWidgets) {
        expect(ext.disabled).toBe(false);
        expect(getAttachTo(ext)).toEqual({
          id: 'page:home',
          input: 'widgets',
        });
      }

      for (const id of COMMUNITY_DEMO_OVERRIDE_IDS) {
        expect(extensions.find(ext => ext.id === id)?.disabled).toBe(true);
      }
    });

    it('homepage widgets, layout, and default-widgets API attach to page:homepage', () => {
      const homepageExtensions = getRuntimeExtensions(homepagePlugin);

      const homepageWidgets = homepageExtensions.filter(ext =>
        ext.id.startsWith('home-page-widget:'),
      );
      expect(homepageWidgets.length).toBeGreaterThan(0);

      for (const ext of homepageWidgets) {
        expect(getAttachTo(ext)).toEqual({
          id: HOMEPAGE_PAGE_ID,
          input: 'widgets',
        });
      }

      const layout = homepageExtensions.find(ext =>
        ext.id.startsWith('home-page-layout:'),
      );
      expect(layout).toBeDefined();
      expect(getAttachTo(layout!)).toEqual({
        id: HOMEPAGE_PAGE_ID,
        input: 'layout',
      });

      expect(
        homepageExtensions.some(
          ext => ext.id === 'api:homepage/default-widgets',
        ),
      ).toBe(true);
    });

    it('should export homepageTranslationsModule with correct structure', () => {
      expect(homepageTranslationsModule).toBeDefined();
      expect(homepageTranslationsModule.$$type).toBe(
        '@backstage/FrontendModule',
      );
      expect(homepageTranslationsModule.pluginId).toBe('app');
    });

    it('should default-export app modules for NFS discovery', () => {
      expect(translationsModuleDefault).toBe(homepageTranslationsModule);
    });
  });

  describe('Translations', () => {
    it('should export homepageTranslationRef', () => {
      expect(homepageTranslationRef).toBeDefined();
      expect(homepageTranslationRef.id).toBe('plugin.homepage');
    });

    it('should export homepageTranslations', () => {
      expect(homepageTranslations).toBeDefined();
      expect(typeof homepageTranslations).toBe('object');
    });
  });

  describe('Layout Extension', () => {
    it('should export homePageLayoutExtension', () => {
      expect(homePageLayoutExtension).toBeDefined();
    });
  });

  describe('Widget Extensions', () => {
    it('should export all widget extensions', () => {
      expect(onboardingSectionWidget).toBeDefined();
      expect(entitySectionWidget).toBeDefined();
      expect(templateSectionWidget).toBeDefined();
      expect(quickAccessCardWidget).toBeDefined();
      expect(searchBarWidget).toBeDefined();
      expect(featuredDocsCardWidget).toBeDefined();
      expect(catalogStarredWidget).toBeDefined();
      expect(communityHomeWidgets).toBeDefined();
      expect(disableToolkit).toBeDefined();
      expect(disableRandomJoke).toBeDefined();
      expect(RecentlyVisitedWidget).toBeDefined();
      expect(TopVisitedWidget).toBeDefined();
    });
  });

  describe('APIs', () => {
    it('should export quickAccessApi', () => {
      expect(quickAccessApi).toBeDefined();
    });

    it('should export defaultWidgetsApi', () => {
      expect(defaultWidgetsApi).toBeDefined();
    });
  });
});
